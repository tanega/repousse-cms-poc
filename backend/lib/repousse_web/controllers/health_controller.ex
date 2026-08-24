defmodule RepousseWeb.HealthController do
  use RepousseWeb, :controller

  def alive(conn, _params) do
    json(conn, %{alive: true})
  end

  def ready(conn, _params) do
    case Ecto.Adapters.SQL.query(Repousse.Repo, "SELECT 1", []) do
      {:ok, _} ->
        json(conn, %{ready: true})

      {:error, _} ->
        conn
        |> put_status(:service_unavailable)
        |> json(%{ready: false})
    end
  end
end
