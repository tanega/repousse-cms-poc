defmodule RepousseWeb.WaitlistController do
  use RepousseWeb, :controller
  use OpenApiSpex.ControllerSpecs
  action_fallback RepousseWeb.FallbackController

  alias Repousse.Distributions
  alias RepousseWeb.OpenApiHelpers, as: API
  alias RepousseWeb.Schemas.WaitlistEntry

  tags ["Waitlist"]
  security [%{"bearerAuth" => []}]

  operation :join,
    summary: "Join the waitlist for a taxon at a distribution event",
    parameters: [
      id: [in: :path, type: :string, description: "Event ID"],
      taxon_id: [in: :query, type: :string, description: "Taxon ID"]
    ],
    responses: [created: API.object(WaitlistEntry, "Waitlist entry")]

  def join(conn, %{"id" => event_id, "taxon_id" => taxon_id}) do
    user_id = conn.assigns.current_user.id

    with {:ok, entry} <- Distributions.join_waitlist(user_id, event_id, taxon_id) do
      conn |> put_status(:created) |> json(%{data: entry})
    end
  end

  operation :leave,
    summary: "Leave the waitlist for a taxon at a distribution event",
    parameters: [
      id: [in: :path, type: :string, description: "Event ID"],
      taxon_id: [in: :query, type: :string, description: "Taxon ID"]
    ],
    responses: [no_content: API.no_content()]

  def leave(conn, %{"id" => event_id, "taxon_id" => taxon_id}) do
    user_id = conn.assigns.current_user.id

    with {:ok, _} <- Distributions.leave_waitlist(user_id, event_id, taxon_id) do
      send_resp(conn, :no_content, "")
    end
  end
end
