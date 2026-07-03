defmodule Repousse.Auth.HankoAdmin do
  @moduledoc """
  Talks to the Hanko Admin API (:8001) to keep Hanko identities in sync with
  Repousse accounts. Shared by `Mix.Tasks.Repousse.CreateAdmin` and the
  account-creation flows in `Repousse.Accounts`.
  """

  @doc """
  Creates a Hanko user for `email`, or looks up the existing one on a 409.

  `is_verified: true` skips Hanko's own email confirmation — used for
  operator-created accounts (e.g. `mix repousse.create_admin`). Guest
  self-signups should pass `is_verified: false` since Repousse, not Hanko,
  owns the confirmation email in that flow.
  """
  def create_or_find_user(email, opts \\ []) do
    is_verified = Keyword.get(opts, :is_verified, false)
    base_url = admin_url()

    payload = %{
      emails: [%{address: email, is_primary: true, is_verified: is_verified}]
    }

    case Req.post("#{base_url}/users", json: payload) do
      {:ok, %{status: status, body: body}} when status in [200, 201] ->
        {:ok, body["id"]}

      {:ok, %{status: 409}} ->
        find_by_email(base_url, email)

      {:ok, %{status: status, body: body}} ->
        {:error, "HTTP #{status}: #{inspect(body)}"}

      {:error, %{reason: reason}} ->
        {:error, "Connection error — is Hanko running at #{base_url}? (#{inspect(reason)})"}
    end
  end

  def delete_user(hanko_id) do
    case Req.delete("#{admin_url()}/users/#{hanko_id}") do
      {:ok, %{status: status}} when status in [200, 204, 404] -> :ok
      {:ok, %{status: status, body: body}} -> {:error, "HTTP #{status}: #{inspect(body)}"}
      {:error, %{reason: reason}} -> {:error, inspect(reason)}
    end
  end

  defp find_by_email(base_url, email) do
    case Req.get("#{base_url}/users", params: [email: email, page_size: 1]) do
      {:ok, %{status: 200, body: [%{"id" => id} | _]}} -> {:ok, id}
      {:ok, %{status: 200, body: %{"id" => id}}} -> {:ok, id}
      {:ok, %{status: 200, body: body}} -> {:error, "User not found after 409: #{inspect(body)}"}
      {:ok, %{status: status, body: body}} -> {:error, "Lookup failed HTTP #{status}: #{inspect(body)}"}
      {:error, reason} -> {:error, inspect(reason)}
    end
  end

  defp admin_url, do: Application.fetch_env!(:repousse, :hanko)[:admin_url]
end
