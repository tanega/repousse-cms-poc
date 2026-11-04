defmodule RepousseWeb.ReservationController do
  use RepousseWeb, :controller
  use OpenApiSpex.ControllerSpecs
  action_fallback RepousseWeb.FallbackController

  alias Repousse.Distributions
  alias Repousse.Distributions.Policy
  alias RepousseWeb.OpenApiHelpers, as: API
  alias RepousseWeb.Schemas.Reservation

  tags ["Reservations"]
  security [%{"bearerAuth" => []}]

  operation :create,
    summary: "Reserve items at a distribution event slot",
    parameters: [id: [in: :path, type: :string, description: "Event ID"]],
    request_body:
      {"Reservation attributes (slot_id, event_id, project_id, items)", "application/json",
       %OpenApiSpex.Schema{type: :object}},
    responses: [created: API.object(Reservation, "Created reservation")]

  def create(conn, %{"reservation" => %{"slot_id" => slot_id, "event_id" => event_id, "project_id" => project_id, "items" => items}}) do
    user = conn.assigns.current_user
    slot = Distributions.get_slot!(slot_id)
    event = Distributions.get_event!(event_id)
    project = Repousse.Projects.get_project!(project_id)
    items_attrs = Enum.map(items, &%{stock_id: &1["stock_id"], qty: &1["qty"], taxon_id: &1["taxon_id"]})

    with :ok <- Bodyguard.permit(Policy, :reserve, user, %{}),
         {:ok, %{reservation: reservation}} <- Distributions.create_reservation(user, slot, event, project, items_attrs) do
      conn |> put_status(:created) |> json(%{data: reservation})
    end
  end

  operation :mine,
    summary: "Get the current user's reservation for a distribution event",
    parameters: [id: [in: :path, type: :string, description: "Event ID"]],
    responses: [ok: API.object(Reservation, "Reservation")]

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
    responses: [ok: API.object(Reservation, "Cancelled reservation"), forbidden: API.object("Not your reservation")]

  operation :handovers,
    summary: "List reservations so a volunteer can record what was picked up",
    parameters: [distribution_id: [in: :path, type: :string, description: "Event ID"]],
    responses: [ok: API.list("Handover rows")]

  def handovers(conn, %{"distribution_id" => event_id}) do
    with :ok <- Bodyguard.permit(Policy, :record_handover, conn.assigns.current_user, %{}) do
      json(conn, %{data: Distributions.handover_rows(event_id)})
    end
  end

  operation :handover,
    summary: "Record the trees an adoptant actually picked up and attach them to their project",
    parameters: [
      distribution_id: [in: :path, type: :string, description: "Event ID"],
      id: [in: :path, type: :string, description: "Reservation ID"]
    ],
    request_body: {"Quantities actually handed over", "application/json", %OpenApiSpex.Schema{type: :object}},
    responses: [ok: API.object(Reservation, "Validated reservation")]

  def handover(conn, %{"distribution_id" => event_id, "id" => id} = params) do
    reservation = Distributions.get_reservation!(id)
    raw_items = get_in(params, ["handover", "items"]) || []

    cond do
      reservation.event_id != event_id ->
        {:error, :not_found}

      true ->
        with :ok <- Bodyguard.permit(Policy, :record_handover, conn.assigns.current_user, %{}),
             {:ok, items} <- normalize_handover_items(raw_items),
             {:ok, validated} <- Distributions.record_handover(reservation, items, conn.assigns.current_user) do
          json(conn, %{data: validated})
        end
    end
  end

  defp normalize_handover_items(items) when is_list(items) do
    Enum.reduce_while(items, {:ok, []}, fn item, {:ok, acc} ->
      taxon_id = item["taxon_id"]
      quantity = item["quantity"]

      if is_binary(taxon_id) and is_integer(quantity) and quantity > 0 do
        {:cont, {:ok, [%{taxon_id: taxon_id, quantity: quantity} | acc]}}
      else
        {:halt, {:error, :invalid_handover}}
      end
    end)
    |> case do
      {:ok, []} -> {:error, :invalid_handover}
      other -> other
    end
  end

  defp normalize_handover_items(_), do: {:error, :invalid_handover}

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
