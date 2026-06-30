defmodule RepousseWeb.WaitlistController do
  use RepousseWeb, :controller
  action_fallback RepousseWeb.FallbackController

  alias Repousse.Distributions

  def join(conn, %{"id" => event_id, "taxon_id" => taxon_id}) do
    user_id = conn.assigns.current_user.id

    with {:ok, entry} <- Distributions.join_waitlist(user_id, event_id, taxon_id) do
      conn |> put_status(:created) |> json(%{data: entry})
    end
  end

  def leave(conn, %{"id" => event_id, "taxon_id" => taxon_id}) do
    user_id = conn.assigns.current_user.id

    with {:ok, _} <- Distributions.leave_waitlist(user_id, event_id, taxon_id) do
      send_resp(conn, :no_content, "")
    end
  end
end
