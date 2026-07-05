defmodule RepousseWeb.Admin.DistributionController do
  use RepousseWeb, :controller
  use OpenApiSpex.ControllerSpecs
  action_fallback RepousseWeb.FallbackController

  alias OpenApiSpex.Schema
  alias Repousse.Distributions
  alias Repousse.Distributions.Policy

  tags(["admin", "distributions"])
  security([%{"bearerAuth" => []}])

  operation(:index,
    summary: "List distribution events (admin)",
    responses: [ok: {"Distribution events", "application/json", %Schema{type: :object}}]
  )

  def index(conn, _params) do
    with :ok <- Bodyguard.permit(Policy, :manage_event, conn.assigns.current_user) do
      json(conn, %{data: Distributions.list_events()})
    end
  end

  operation(:show,
    summary: "Get a distribution event (admin)",
    parameters: [id: [in: :path, type: :string, required: true, description: "Event ID"]],
    responses: [ok: {"Distribution event", "application/json", %Schema{type: :object}}]
  )

  def show(conn, %{"id" => id}) do
    with :ok <- Bodyguard.permit(Policy, :manage_event, conn.assigns.current_user) do
      json(conn, %{data: Distributions.get_event!(id)})
    end
  end

  operation(:create,
    summary: "Create a distribution event (US-DIST-01)",
    request_body: {"Event params", "application/json", %Schema{type: :object}},
    responses: [created: {"Created event", "application/json", %Schema{type: :object}}]
  )

  def create(conn, %{"distribution" => params}) do
    with :ok <- Bodyguard.permit(Policy, :manage_event, conn.assigns.current_user),
         {:ok, event} <- Distributions.create_event(params) do
      conn |> put_status(:created) |> json(%{data: event})
    end
  end

  operation(:update,
    summary: "Update a distribution event",
    parameters: [id: [in: :path, type: :string, required: true, description: "Event ID"]],
    request_body: {"Event params", "application/json", %Schema{type: :object}},
    responses: [ok: {"Updated event", "application/json", %Schema{type: :object}}]
  )

  def update(conn, %{"id" => id, "distribution" => params}) do
    with :ok <- Bodyguard.permit(Policy, :manage_event, conn.assigns.current_user) do
      event = Distributions.get_event!(id)

      with {:ok, updated} <- Distributions.update_event(event, params),
           do: json(conn, %{data: updated})
    end
  end

  operation(:delete,
    summary: "Delete a distribution event",
    parameters: [id: [in: :path, type: :string, required: true, description: "Event ID"]],
    responses: [no_content: {"Deleted", "application/json", %Schema{type: :object}}]
  )

  def delete(conn, %{"id" => id}) do
    with :ok <- Bodyguard.permit(Policy, :manage_event, conn.assigns.current_user) do
      event = Distributions.get_event!(id)
      with {:ok, _} <- Repousse.Repo.delete(event), do: send_resp(conn, :no_content, "")
    end
  end

  operation(:publish,
    summary: "Publish a distribution event and trigger the email campaign (US-DIST-05)",
    parameters: [id: [in: :path, type: :string, required: true, description: "Event ID"]],
    responses: [ok: {"Published event", "application/json", %Schema{type: :object}}]
  )

  def publish(conn, %{"id" => id}) do
    with :ok <- Bodyguard.permit(Policy, :manage_event, conn.assigns.current_user) do
      event = Distributions.get_event!(id)
      with {:ok, updated} <- Distributions.publish_event(event), do: json(conn, %{data: updated})
    end
  end

  operation(:close,
    summary: "Close a distribution event (US-DIST-04)",
    parameters: [id: [in: :path, type: :string, required: true, description: "Event ID"]],
    responses: [ok: {"Closed event", "application/json", %Schema{type: :object}}]
  )

  def close(conn, %{"id" => id}) do
    with :ok <- Bodyguard.permit(Policy, :manage_event, conn.assigns.current_user) do
      event = Distributions.get_event!(id)
      with {:ok, updated} <- Distributions.close_event(event), do: json(conn, %{data: updated})
    end
  end

  operation(:attendees,
    summary: "List attendees for an event, or a single slot (US-DIST-10)",
    description:
      "For the field-day mobile view: pass `slot_id` to scope the list to a single slot " <>
        "once the coordinator has picked event then slot; omit it to list every non-cancelled " <>
        "reservation across the whole event.",
    parameters: [
      distribution_id: [in: :path, type: :string, required: true, description: "Event ID"],
      slot_id: [in: :query, type: :string, required: false, description: "Slot ID"]
    ],
    responses: [ok: {"Attendee reservations", "application/json", %Schema{type: :object}}]
  )

  def attendees(conn, %{"distribution_id" => id} = params) do
    with :ok <- Bodyguard.permit(Policy, :manage_event, conn.assigns.current_user) do
      reservations =
        case params["slot_id"] do
          nil -> Distributions.list_reservations_for_event(id)
          slot_id -> Distributions.list_slot_reservations(slot_id)
        end

      json(conn, %{data: reservations})
    end
  end
end
