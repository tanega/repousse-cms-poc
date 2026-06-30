defmodule RepousseWeb.Admin.StockController do
  use RepousseWeb, :controller
  action_fallback RepousseWeb.FallbackController

  alias Repousse.Distributions

  def index(conn, %{"distribution_id" => event_id}) do
    stocks = Distributions.list_stocks(event_id)
    json(conn, %{data: stocks})
  end

  def create(conn, %{"distribution_id" => event_id, "stock" => params}) do
    with {:ok, stock} <- Distributions.create_stock(Map.put(params, "event_id", event_id)) do
      conn |> put_status(:created) |> json(%{data: stock})
    end
  end

  def update(conn, %{"id" => id, "stock" => params}) do
    stock = Distributions.get_stock!(id)
    with {:ok, updated} <- Distributions.update_stock(stock, params), do: json(conn, %{data: updated})
  end

  def delete(conn, %{"id" => id}) do
    stock = Distributions.get_stock!(id)
    with {:ok, _} <- Repousse.Repo.delete(stock), do: send_resp(conn, :no_content, "")
  end
end
