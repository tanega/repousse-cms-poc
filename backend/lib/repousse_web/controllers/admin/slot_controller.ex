defmodule RepousseWeb.Admin.SlotController do
  use RepousseWeb, :controller
  use OpenApiSpex.ControllerSpecs
  action_fallback RepousseWeb.FallbackController

  alias Repousse.Distributions
  alias RepousseWeb.OpenApiHelpers, as: API

  tags ["Admin — Slots"]
  security [%{"bearerAuth" => []}]

  operation :index,
    summary: "List slots for a distribution event (admin)",
    parameters: [distribution_id: [in: :path, type: :string, description: "Event ID"]],
    responses: [ok: API.list("Slots")]

  def index(conn, %{"distribution_id" => event_id}) do
    slots = Distributions.list_slots(event_id)
    json(conn, %{data: slots})
  end

  operation :show,
    summary: "Get a slot (admin)",
    parameters: [
      distribution_id: [in: :path, type: :string, description: "Event ID"],
      id: [in: :path, type: :string, description: "Slot ID"]
    ],
    responses: [ok: API.object("Slot")]

  def show(conn, %{"id" => id}) do
    json(conn, %{data: Distributions.get_slot!(id)})
  end

  operation :create,
    summary: "Create a slot for a distribution event (admin)",
    parameters: [distribution_id: [in: :path, type: :string, description: "Event ID"]],
    request_body: {"Slot attributes", "application/json", %OpenApiSpex.Schema{type: :object}},
    responses: [created: API.object("Created slot")]

  def create(conn, %{"distribution_id" => event_id, "slot" => params}) do
    with {:ok, slot} <- Distributions.create_slot(Map.put(params, "event_id", event_id)) do
      conn |> put_status(:created) |> json(%{data: slot})
    end
  end

  operation :update,
    summary: "Update a slot (admin)",
    parameters: [
      distribution_id: [in: :path, type: :string, description: "Event ID"],
      id: [in: :path, type: :string, description: "Slot ID"]
    ],
    request_body: {"Slot attributes", "application/json", %OpenApiSpex.Schema{type: :object}},
    responses: [ok: API.object("Updated slot")]

  def update(conn, %{"id" => id, "slot" => params}) do
    slot = Distributions.get_slot!(id)
    with {:ok, updated} <- Distributions.update_slot(slot, params), do: json(conn, %{data: updated})
  end

  operation :delete,
    summary: "Delete a slot (admin)",
    parameters: [
      distribution_id: [in: :path, type: :string, description: "Event ID"],
      id: [in: :path, type: :string, description: "Slot ID"]
    ],
    responses: [no_content: API.no_content()]

  def delete(conn, %{"id" => id}) do
    slot = Distributions.get_slot!(id)
    with {:ok, _} <- Repousse.Repo.delete(slot), do: send_resp(conn, :no_content, "")
  end
end
