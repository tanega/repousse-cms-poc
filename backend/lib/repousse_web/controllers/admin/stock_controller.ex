defmodule RepousseWeb.Admin.StockController do
  use RepousseWeb, :controller
  use OpenApiSpex.ControllerSpecs
  action_fallback RepousseWeb.FallbackController

  alias OpenApiSpex.Schema
  alias Repousse.Distributions
  alias Repousse.Distributions.Policy

  tags(["admin", "stocks"])
  security([%{"bearerAuth" => []}])

  operation(:index,
    summary: "List an event's stock (US-DIST-03)",
    parameters: [
      distribution_id: [in: :path, type: :string, required: true, description: "Event ID"]
    ],
    responses: [ok: {"Stocks", "application/json", %Schema{type: :object}}]
  )

  def index(conn, %{"distribution_id" => event_id}) do
    with :ok <- Bodyguard.permit(Policy, :manage_event, conn.assigns.current_user) do
      stocks = Distributions.list_stocks(event_id)
      json(conn, %{data: stocks})
    end
  end

  operation(:create,
    summary: "Associate a taxon and its available quantity to an event (US-DIST-03)",
    parameters: [
      distribution_id: [in: :path, type: :string, required: true, description: "Event ID"]
    ],
    request_body: {"Stock params", "application/json", %Schema{type: :object}},
    responses: [created: {"Created stock", "application/json", %Schema{type: :object}}]
  )

  def create(conn, %{"distribution_id" => event_id, "stock" => params}) do
    with :ok <- Bodyguard.permit(Policy, :manage_event, conn.assigns.current_user),
         {:ok, stock} <- Distributions.create_stock(Map.put(params, "event_id", event_id)) do
      conn |> put_status(:created) |> json(%{data: stock})
    end
  end

  operation(:update,
    summary: "Update a stock's available quantity (US-DIST-03)",
    parameters: [id: [in: :path, type: :string, required: true, description: "Stock ID"]],
    request_body: {"Stock params", "application/json", %Schema{type: :object}},
    responses: [ok: {"Updated stock", "application/json", %Schema{type: :object}}]
  )

  def update(conn, %{"id" => id, "stock" => params}) do
    with :ok <- Bodyguard.permit(Policy, :manage_event, conn.assigns.current_user) do
      stock = Distributions.get_stock!(id)

      with {:ok, updated} <- Distributions.update_stock(stock, params),
           do: json(conn, %{data: updated})
    end
  end

  operation(:delete,
    summary: "Remove a taxon's stock from an event",
    parameters: [id: [in: :path, type: :string, required: true, description: "Stock ID"]],
    responses: [no_content: {"Deleted", "application/json", %Schema{type: :object}}]
  )

  def delete(conn, %{"id" => id}) do
    with :ok <- Bodyguard.permit(Policy, :manage_event, conn.assigns.current_user) do
      stock = Distributions.get_stock!(id)
      with {:ok, _} <- Repousse.Repo.delete(stock), do: send_resp(conn, :no_content, "")
    end
  end
end
