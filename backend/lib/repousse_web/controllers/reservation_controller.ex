defmodule RepousseWeb.ReservationController do
  use RepousseWeb, :controller
  use OpenApiSpex.ControllerSpecs
  action_fallback RepousseWeb.FallbackController

  alias Repousse.Distributions
  alias RepousseWeb.OpenApiHelpers, as: API

  tags ["Reservations"]
  security [%{"bearerAuth" => []}]

  operation :create,
    summary: "Reserve items at a distribution event slot",
    parameters: [id: [in: :path, type: :string, description: "Event ID"]],
    request_body:
      {"Reservation attributes (slot_id, event_id, project_id, items)", "application/json",
       %OpenApiSpex.Schema{type: :object}},
    responses: [created: API.object("Created reservation")]

  def create(conn, %{"reservation" => %{"slot_id" => slot_id, "event_id" => event_id, "project_id" => project_id, "items" => items}}) do
    user = conn.assigns.current_user
    slot = Distributions.get_slot!(slot_id)
    event = Distributions.get_event!(event_id)
    project = Repousse.Projects.get_project!(project_id)
    items_attrs = Enum.map(items, &%{stock_id: &1["stock_id"], qty: &1["qty"], taxon_id: &1["taxon_id"]})

    with {:ok, %{reservation: reservation}} <- Distributions.create_reservation(user, slot, event, project, items_attrs) do
      conn |> put_status(:created) |> json(%{data: reservation})
    end
  end

  operation :mine,
    summary: "Get the current user's reservation for a distribution event",
    parameters: [id: [in: :path, type: :string, description: "Event ID"]],
    responses: [ok: API.object("Reservation")]

  def mine(conn, %{"id" => event_id}) do
    user_id = conn.assigns.current_user.id
    reservation = Distributions.get_user_reservation(user_id, event_id)
    json(conn, %{data: reservation})
  end

  operation :cancel,
    summary: "Cancel a reservation",
    parameters: [
      distribution_id: [in: :path, type: :string, description: "Event ID"],
      id: [in: :path, type: :string, description: "Reservation ID"]
    ],
    responses: [ok: API.object("Cancelled reservation"), forbidden: API.object("Not your reservation")]

  def cancel(conn, %{"id" => id}) do
    reservation = Distributions.get_reservation!(id)

    if reservation.user_id != conn.assigns.current_user.id do
      {:error, :forbidden}
    else
      with {:ok, %{reservation: cancelled}} <- Distributions.cancel_reservation(reservation) do
        json(conn, %{data: cancelled})
      end
    end
  end
end
