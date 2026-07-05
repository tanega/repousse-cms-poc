defmodule RepousseWeb.ReservationController do
  use RepousseWeb, :controller
  use OpenApiSpex.ControllerSpecs
  action_fallback RepousseWeb.FallbackController

  alias OpenApiSpex.Schema
  alias Repousse.Distributions
  alias Repousse.Distributions.Policy

  tags(["reservations"])
  security([%{"bearerAuth" => []}])

  operation(:create,
    summary: "Reserve plants on a slot (US-DIST-07)",
    description:
      "Requires an active, current-year adhesion (epic-02 US-AUTH-04) — " <>
        "a suspended or lapsed-membership account cannot reserve.",
    parameters: [id: [in: :path, type: :string, required: true, description: "Event ID"]],
    request_body: {"Reservation params", "application/json", %Schema{type: :object}},
    responses: [
      created: {"Created reservation", "application/json", %Schema{type: :object}},
      unauthorized: {"Not allowed to reserve", "application/json", %Schema{type: :object}},
      bad_request:
        {"Event not open for reservations / insufficient stock", "application/json",
         %Schema{type: :object}},
      unprocessable_entity: {"Validation failed", "application/json", %Schema{type: :object}}
    ]
  )

  def create(conn, %{
        "reservation" => %{
          "slot_id" => slot_id,
          "event_id" => event_id,
          "project_id" => project_id,
          "items" => items
        }
      }) do
    user = conn.assigns.current_user

    with :ok <- Bodyguard.permit(Policy, :reserve, user) do
      slot = Distributions.get_slot!(slot_id)
      event = Distributions.get_event!(event_id)
      project = Repousse.Projects.get_project!(project_id)

      items_attrs =
        Enum.map(items, &%{stock_id: &1["stock_id"], qty: &1["qty"], taxon_id: &1["taxon_id"]})

      case Distributions.create_reservation(user, slot, event, project, items_attrs) do
        {:ok, %{reservation: reservation}} ->
          conn |> put_status(:created) |> json(%{data: reservation})

        error ->
          translate_error(error)
      end
    end
  end

  operation(:mine,
    summary: "Get the current user's reservation for an event",
    parameters: [id: [in: :path, type: :string, required: true, description: "Event ID"]],
    responses: [ok: {"Reservation (or null)", "application/json", %Schema{type: :object}}]
  )

  def mine(conn, %{"id" => event_id}) do
    user_id = conn.assigns.current_user.id
    reservation = Distributions.get_user_reservation(user_id, event_id)
    json(conn, %{data: reservation})
  end

  operation(:cancel,
    summary: "Cancel a reservation (US-DIST-09)",
    description: "Blocked less than 48h before the reserved slot, or once the event is closed.",
    parameters: [
      distribution_id: [in: :path, type: :string, required: true, description: "Event ID"],
      id: [in: :path, type: :string, required: true, description: "Reservation ID"]
    ],
    responses: [
      ok: {"Cancelled reservation", "application/json", %Schema{type: :object}},
      forbidden:
        {"Not the owner of this reservation", "application/json", %Schema{type: :object}},
      bad_request:
        {"Cancellation window closed / event closed", "application/json", %Schema{type: :object}}
    ]
  )

  def cancel(conn, %{"id" => id}) do
    reservation = Distributions.get_reservation!(id)

    if reservation.user_id != conn.assigns.current_user.id do
      {:error, :forbidden}
    else
      case Distributions.cancel_reservation(reservation) do
        {:ok, %{reservation: cancelled}} -> json(conn, %{data: cancelled})
        error -> translate_error(error)
      end
    end
  end

  # `Distributions.create_reservation/5` and `cancel_reservation/1` run
  # inside an `Ecto.Multi`, whose failures come back as
  # `{:error, step, reason, changes_so_far}` rather than the plain
  # `{:error, reason}` shape `FallbackController` knows how to render;
  # `create_reservation/5` can also short-circuit with a plain
  # `{:error, atom}` before the Multi even runs. Normalize both into
  # something `FallbackController` already handles (a changeset, or a
  # binary reason rendered as a 400).
  defp translate_error({:error, %Ecto.Changeset{}} = error), do: error

  defp translate_error({:error, _step, %Ecto.Changeset{} = changeset, _changes}),
    do: {:error, changeset}

  defp translate_error({:error, _step, reason, _changes}), do: {:error, to_string(reason)}
  defp translate_error({:error, reason}) when is_atom(reason), do: {:error, to_string(reason)}
  defp translate_error(error), do: error
end
