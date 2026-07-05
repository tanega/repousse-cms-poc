defmodule RepousseWeb.Admin.ReservationController do
  use RepousseWeb, :controller
  use OpenApiSpex.ControllerSpecs
  action_fallback RepousseWeb.FallbackController

  alias OpenApiSpex.Schema
  alias Repousse.Distributions
  alias Repousse.Distributions.Policy

  tags(["admin", "reservations"])
  security([%{"bearerAuth" => []}])

  operation(:validate,
    summary: "Record the quantities actually distributed to an adoptant (US-DIST-11)",
    description:
      "The reserved quantity is the default; the coordinator may freely override it via " <>
        "`items`, or mark the adoptant as a no-show with `no_show: true`. Validation is " <>
        "recorded independently per adoptant.",
    parameters: [
      distribution_id: [in: :path, type: :string, required: true, description: "Event ID"],
      reservation_id: [in: :path, type: :string, required: true, description: "Reservation ID"]
    ],
    request_body:
      {"Validation params (coordinator_note, items, no_show?)", "application/json",
       %Schema{type: :object}},
    responses: [
      ok: {"Validated reservation", "application/json", %Schema{type: :object}},
      unauthorized: {"Not a coordinator", "application/json", %Schema{type: :object}}
    ]
  )

  def validate(conn, %{"reservation_id" => id} = params) do
    with :ok <- Bodyguard.permit(Policy, :validate_reservation, conn.assigns.current_user) do
      reservation = Distributions.get_reservation!(id)

      if params["no_show"] in [true, "true"] do
        with {:ok, validated} <- Distributions.mark_no_show(reservation) do
          json(conn, %{data: validated})
        end
      else
        attrs = Map.take(params, ["coordinator_note", "items"])

        case Distributions.validate_reservation(reservation, attrs) do
          {:ok, %{reservation: validated}} -> json(conn, %{data: validated})
          error -> translate_error(error)
        end
      end
    end
  end

  # `validate_reservation/2` runs inside an `Ecto.Multi`, so failures come
  # back as `{:error, step, reason, changes_so_far}`; normalize that (and
  # any bare atom reason) into something `FallbackController` already
  # handles (a changeset, or a binary reason rendered as a 400).
  defp translate_error({:error, %Ecto.Changeset{}} = error), do: error

  defp translate_error({:error, _step, %Ecto.Changeset{} = changeset, _changes}),
    do: {:error, changeset}

  defp translate_error({:error, _step, reason, _changes}), do: {:error, to_string(reason)}
  defp translate_error({:error, reason}) when is_atom(reason), do: {:error, to_string(reason)}
  defp translate_error(error), do: error
end
