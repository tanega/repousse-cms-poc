defmodule RepousseWeb.Admin.SlotController do
  use RepousseWeb, :controller
  use OpenApiSpex.ControllerSpecs
  action_fallback RepousseWeb.FallbackController

  alias OpenApiSpex.Schema
  alias Repousse.Distributions
  alias Repousse.Distributions.Policy

  tags(["admin", "slots"])
  security([%{"bearerAuth" => []}])

  operation(:index,
    summary: "List an event's slots (US-DIST-02)",
    parameters: [
      distribution_id: [in: :path, type: :string, required: true, description: "Event ID"]
    ],
    responses: [ok: {"Slots", "application/json", %Schema{type: :object}}]
  )

  def index(conn, %{"distribution_id" => event_id}) do
    with :ok <- Bodyguard.permit(Policy, :manage_event, conn.assigns.current_user) do
      slots = Distributions.list_slots(event_id)
      json(conn, %{data: slots})
    end
  end

  operation(:show,
    summary: "Get a slot",
    parameters: [id: [in: :path, type: :string, required: true, description: "Slot ID"]],
    responses: [ok: {"Slot", "application/json", %Schema{type: :object}}]
  )

  def show(conn, %{"id" => id}) do
    with :ok <- Bodyguard.permit(Policy, :manage_event, conn.assigns.current_user) do
      json(conn, %{data: Distributions.get_slot!(id)})
    end
  end

  operation(:create,
    summary: "Add a slot to an event (US-DIST-02)",
    description: "Blocked once the event is Closed.",
    parameters: [
      distribution_id: [in: :path, type: :string, required: true, description: "Event ID"]
    ],
    request_body: {"Slot params", "application/json", %Schema{type: :object}},
    responses: [created: {"Created slot", "application/json", %Schema{type: :object}}]
  )

  def create(conn, %{"distribution_id" => event_id, "slot" => params}) do
    with :ok <- Bodyguard.permit(Policy, :manage_event, conn.assigns.current_user) do
      case Distributions.create_slot(Map.put(params, "event_id", event_id)) do
        {:ok, slot} -> conn |> put_status(:created) |> json(%{data: slot})
        error -> translate_error(error)
      end
    end
  end

  operation(:update,
    summary: "Update a slot (US-DIST-02)",
    description: "Blocked once the event is Closed.",
    parameters: [id: [in: :path, type: :string, required: true, description: "Slot ID"]],
    request_body: {"Slot params", "application/json", %Schema{type: :object}},
    responses: [ok: {"Updated slot", "application/json", %Schema{type: :object}}]
  )

  def update(conn, %{"id" => id, "slot" => params}) do
    with :ok <- Bodyguard.permit(Policy, :manage_event, conn.assigns.current_user) do
      slot = Distributions.get_slot!(id)

      case Distributions.update_slot(slot, params) do
        {:ok, updated} -> json(conn, %{data: updated})
        error -> translate_error(error)
      end
    end
  end

  operation(:delete,
    summary: "Delete a slot (US-DIST-02)",
    description:
      "Blocked once the event is Closed, or while the slot still has active reservations.",
    parameters: [id: [in: :path, type: :string, required: true, description: "Slot ID"]],
    responses: [
      no_content: {"Deleted", "application/json", %Schema{type: :object}},
      bad_request:
        {"Slot has active reservations, or event is closed", "application/json",
         %Schema{type: :object}}
    ]
  )

  def delete(conn, %{"id" => id}) do
    with :ok <- Bodyguard.permit(Policy, :manage_event, conn.assigns.current_user) do
      slot = Distributions.get_slot!(id)

      case Distributions.delete_slot(slot) do
        {:ok, _} -> send_resp(conn, :no_content, "")
        error -> translate_error(error)
      end
    end
  end

  # `create_slot/1`, `update_slot/2`, and `delete_slot/1` reject with plain
  # atoms (`:event_closed`, `:slot_has_active_reservations`) that
  # `FallbackController` doesn't have a clause for; normalize them to a
  # binary reason, which it renders as a 400.
  defp translate_error({:error, %Ecto.Changeset{}} = error), do: error
  defp translate_error({:error, reason}) when is_atom(reason), do: {:error, to_string(reason)}
  defp translate_error(error), do: error
end
