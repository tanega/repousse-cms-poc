defmodule Repousse.Integrations.Workers.HelloassoSyncWorker do
  @moduledoc """
  Oban worker that syncs member data from HelloAsso.
  Scheduled to run daily. Creates/updates users and suspends expired memberships.
  """
  use Oban.Worker, queue: :helloasso, max_attempts: 3

  require Logger
  alias Repousse.Accounts

  @current_year Date.utc_today().year

  @impl Oban.Worker
  def perform(%Oban.Job{}) do
    Logger.info("HelloAsso sync started")

    with {:ok, members} <- fetch_members() do
      results = Enum.map(members, &sync_member/1)

      created = Enum.count(results, &(&1 == :created))
      updated = Enum.count(results, &(&1 == :updated))
      errors = Enum.count(results, &match?({:error, _}, &1))

      Logger.info("HelloAsso sync complete — created: #{created}, updated: #{updated}, errors: #{errors}")

      suspend_inactive_members()

      :ok
    else
      {:error, reason} ->
        Logger.error("HelloAsso sync failed: #{inspect(reason)}")
        {:error, reason}
    end
  end

  defp fetch_members do
    api_url = Application.get_env(:repousse, :helloasso_api_url)
    api_key = Application.get_env(:repousse, :helloasso_api_key)

    case Req.get(api_url, headers: [{"Authorization", "Bearer #{api_key}"}]) do
      {:ok, %{status: 200, body: body}} -> {:ok, body["data"] || []}
      {:ok, %{status: status}} -> {:error, {:http_error, status}}
      {:error, reason} -> {:error, reason}
    end
  end

  defp sync_member(%{"email" => email, "first_name" => first_name, "last_name" => last_name}) do
    attrs = %{
      email: email,
      first_name: first_name,
      last_name: last_name,
      membership_year: @current_year
    }

    case Accounts.sync_member(attrs) do
      {:ok, :created, _user} -> :created
      {:ok, :updated, _user} -> :updated
      {:error, reason} -> {:error, reason}
    end
  end

  defp sync_member(data) do
    Logger.warning("Unexpected HelloAsso member format: #{inspect(data)}")
    {:error, :invalid_format}
  end

  defp suspend_inactive_members do
    count = Accounts.suspend_members_without_current_year_membership(@current_year)
    Logger.info("Suspended #{count} member(s) without #{@current_year} membership")
  end
end
