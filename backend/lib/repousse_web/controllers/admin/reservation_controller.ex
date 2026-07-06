defmodule RepousseWeb.Admin.ReservationController do
  use RepousseWeb, :controller
  use OpenApiSpex.ControllerSpecs
  action_fallback RepousseWeb.FallbackController

  alias Repousse.Distributions
  alias RepousseWeb.OpenApiHelpers, as: API

  tags ["Admin — Reservations"]
  security [%{"bearerAuth" => []}]

  operation :validate,
    summary: "Validate a reservation at check-in (admin)",
    parameters: [
      distribution_id: [in: :path, type: :string, description: "Event ID"],
      reservation_id: [in: :path, type: :string, description: "Reservation ID"]
    ],
    responses: [ok: API.object("Validated reservation")]

  def validate(conn, %{"reservation_id" => id}) do
    reservation = Distributions.get_reservation!(id)
    with {:ok, validated} <- Distributions.validate_reservation(reservation), do: json(conn, %{data: validated})
  end
end
