defmodule RepousseWeb.WaitlistController do
  use RepousseWeb, :controller
  use OpenApiSpex.ControllerSpecs
  action_fallback RepousseWeb.FallbackController

  alias OpenApiSpex.Schema
  alias Repousse.Distributions
  alias Repousse.Distributions.Policy

  tags(["waitlist"])
  security([%{"bearerAuth" => []}])

  operation(:join,
    summary: "Join the waitlist for a taxon (US-DIST-08)",
    description:
      "Requires an active, current-year adhesion (epic-02 US-AUTH-04) — " <>
        "a suspended or lapsed-membership account cannot join a waitlist.",
    parameters: [
      id: [in: :path, type: :string, required: true, description: "Event ID"],
      taxon_id: [in: :query, type: :string, required: true, description: "Taxon ID"]
    ],
    responses: [
      created: {"Waitlist entry", "application/json", %Schema{type: :object}},
      unauthorized:
        {"Not allowed to join the waitlist", "application/json", %Schema{type: :object}}
    ]
  )

  def join(conn, %{"id" => event_id, "taxon_id" => taxon_id}) do
    user = conn.assigns.current_user

    with :ok <- Bodyguard.permit(Policy, :join_waitlist, user),
         {:ok, entry} <- Distributions.join_waitlist(user.id, event_id, taxon_id) do
      conn |> put_status(:created) |> json(%{data: entry})
    end
  end

  operation(:leave,
    summary: "Leave the waitlist for a taxon",
    parameters: [
      id: [in: :path, type: :string, required: true, description: "Event ID"],
      taxon_id: [in: :query, type: :string, required: true, description: "Taxon ID"]
    ],
    responses: [no_content: {"Left the waitlist", "application/json", %Schema{type: :object}}]
  )

  def leave(conn, %{"id" => event_id, "taxon_id" => taxon_id}) do
    user_id = conn.assigns.current_user.id

    with {:ok, _} <- Distributions.leave_waitlist(user_id, event_id, taxon_id) do
      send_resp(conn, :no_content, "")
    end
  end
end
