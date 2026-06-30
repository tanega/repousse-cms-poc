defmodule Repousse.Auth.JwksCache do
  @moduledoc """
  Fetches and caches Hanko's JWKS keys in ETS.
  Refreshes every 5 minutes. Keys are used by AuthPlug to verify JWTs.
  """
  use GenServer
  require Logger

  @table :hanko_jwks
  @refresh_interval :timer.minutes(5)

  def start_link(opts), do: GenServer.start_link(__MODULE__, opts, name: __MODULE__)

  def get_keys do
    case :ets.lookup(@table, :keys) do
      [{:keys, keys}] -> {:ok, keys}
      [] -> {:error, :not_loaded}
    end
  end

  @impl true
  def init(_opts) do
    :ets.new(@table, [:named_table, :public, read_concurrency: true])
    send(self(), :refresh)
    {:ok, %{}}
  end

  @impl true
  def handle_info(:refresh, state) do
    fetch_and_store()
    Process.send_after(self(), :refresh, @refresh_interval)
    {:noreply, state}
  end

  defp fetch_and_store do
    url = Application.get_env(:repousse, :hanko)[:jwks_url]

    case Req.get(url) do
      {:ok, %{status: 200, body: %{"keys" => keys}}} ->
        :ets.insert(@table, {:keys, keys})
        Logger.debug("JWKS refreshed (#{length(keys)} key(s))")

      {:ok, %{status: status}} ->
        Logger.error("JWKS fetch returned #{status}")

      {:error, reason} ->
        Logger.error("JWKS fetch failed: #{inspect(reason)}")
    end
  end
end
