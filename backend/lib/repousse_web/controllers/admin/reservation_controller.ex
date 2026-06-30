defmodule RepousseWeb.Admin.ReservationController do
  use RepousseWeb, :controller
  action_fallback RepousseWeb.FallbackController

  alias Repousse.Distributions

  def validate(conn, %{"reservation_id" => id}) do
    reservation = Distributions.get_reservation!(id)
    with {:ok, validated} <- Distributions.validate_reservation(reservation), do: json(conn, %{data: validated})
  end
end
