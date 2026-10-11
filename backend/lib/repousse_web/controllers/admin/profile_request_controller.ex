defmodule RepousseWeb.Admin.ProfileRequestController do
  use RepousseWeb, :controller
  use OpenApiSpex.ControllerSpecs
  action_fallback RepousseWeb.FallbackController

  alias Repousse.Accounts
  alias RepousseWeb.OpenApiHelpers, as: API
  alias RepousseWeb.Schemas.ProfileRequest

  tags ["Admin — Profile requests"]
  security [%{"bearerAuth" => []}]

  @statuses ~w(pending active rejected)

  operation :index,
    summary: "List engagement-profile requests (admin)",
    parameters: [
      status: [in: :query, type: :string, description: "pending (default), active or rejected"]
    ],
    responses: [ok: API.list(ProfileRequest, "Requests, oldest first")]

  def index(conn, params) do
    status = if params["status"] in @statuses, do: String.to_existing_atom(params["status"]), else: :pending

    json(conn, %{
      data: Enum.map(Accounts.list_profile_requests(status), &present/1),
      meta: %{pending_count: Accounts.count_pending_profile_requests()}
    })
  end

  operation :count,
    summary: "Number of pending profile requests (admin menu badge)",
    responses: [ok: API.object("Pending count")]

  def count(conn, _params) do
    json(conn, %{data: %{pending_count: Accounts.count_pending_profile_requests()}})
  end

  operation :approve,
    summary: "Approve a profile request",
    parameters: [id: [in: :path, type: :string, description: "Profile ID"]],
    responses: [ok: API.object(ProfileRequest, "Approved request")]

  def approve(conn, %{"id" => id}) do
    with {:ok, profile} <- fetch(id),
         {:ok, updated} <- Accounts.approve_profile_request(profile, conn.assigns.current_user) do
      json(conn, %{data: present(updated)})
    end
  end

  operation :reject,
    summary: "Reject a profile request",
    description: "The optional `reason` is shown to the member in their notification.",
    parameters: [id: [in: :path, type: :string, description: "Profile ID"]],
    request_body: {"Rejection", "application/json", %OpenApiSpex.Schema{type: :object}},
    responses: [ok: API.object(ProfileRequest, "Rejected request")]

  def reject(conn, %{"id" => id} = params) do
    with {:ok, profile} <- fetch(id),
         {:ok, updated} <-
           Accounts.reject_profile_request(profile, conn.assigns.current_user, params["reason"]) do
      json(conn, %{data: present(updated)})
    end
  end

  defp present(profile) do
    user = profile.user

    %{
      id: profile.id,
      profile_type: profile.profile_type,
      status: profile.status,
      requested_at: profile.requested_at,
      decided_at: profile.decided_at,
      rejection_reason: profile.rejection_reason,
      user: %{id: user.id, first_name: user.first_name, last_name: user.last_name, email: user.email}
    }
  end

  defp fetch(id) do
    with {:ok, _} <- Ecto.UUID.cast(id),
         %{} = profile <- Accounts.get_profile_request(id) do
      {:ok, profile}
    else
      _ -> {:error, :not_found}
    end
  end
end
