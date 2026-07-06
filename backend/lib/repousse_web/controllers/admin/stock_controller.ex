defmodule RepousseWeb.Admin.StockController do
  use RepousseWeb, :controller
  use OpenApiSpex.ControllerSpecs
  action_fallback RepousseWeb.FallbackController

  alias Repousse.Distributions
  alias RepousseWeb.OpenApiHelpers, as: API

  tags ["Admin — Stocks"]
  security [%{"bearerAuth" => []}]

  operation :index,
    summary: "List stocks for a distribution event (admin)",
    parameters: [distribution_id: [in: :path, type: :string, description: "Event ID"]],
    responses: [ok: API.list("Stocks")]

  def index(conn, %{"distribution_id" => event_id}) do
    stocks = Distributions.list_stocks(event_id)
    json(conn, %{data: stocks})
  end

  operation :create,
    summary: "Create a stock for a distribution event (admin)",
    parameters: [distribution_id: [in: :path, type: :string, description: "Event ID"]],
    request_body: {"Stock attributes", "application/json", %OpenApiSpex.Schema{type: :object}},
    responses: [created: API.object("Created stock")]

  def create(conn, %{"distribution_id" => event_id, "stock" => params}) do
    with {:ok, stock} <- Distributions.create_stock(Map.put(params, "event_id", event_id)) do
      conn |> put_status(:created) |> json(%{data: stock})
    end
  end

  operation :update,
    summary: "Update a stock (admin)",
    parameters: [
      distribution_id: [in: :path, type: :string, description: "Event ID"],
      id: [in: :path, type: :string, description: "Stock ID"]
    ],
    request_body: {"Stock attributes", "application/json", %OpenApiSpex.Schema{type: :object}},
    responses: [ok: API.object("Updated stock")]

  def update(conn, %{"id" => id, "stock" => params}) do
    stock = Distributions.get_stock!(id)
    with {:ok, updated} <- Distributions.update_stock(stock, params), do: json(conn, %{data: updated})
  end

  operation :delete,
    summary: "Delete a stock (admin)",
    parameters: [
      distribution_id: [in: :path, type: :string, description: "Event ID"],
      id: [in: :path, type: :string, description: "Stock ID"]
    ],
    responses: [no_content: API.no_content()]

  def delete(conn, %{"id" => id}) do
    stock = Distributions.get_stock!(id)
    with {:ok, _} <- Repousse.Repo.delete(stock), do: send_resp(conn, :no_content, "")
  end
end
