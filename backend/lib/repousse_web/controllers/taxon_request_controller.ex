defmodule RepousseWeb.TaxonRequestController do
  use RepousseWeb, :controller
  use OpenApiSpex.ControllerSpecs
  action_fallback RepousseWeb.FallbackController

  alias Repousse.Taxa.Requests
  alias RepousseWeb.OpenApiHelpers, as: API
  alias RepousseWeb.Schemas.TaxonRequest

  tags ["Taxon requests"]
  security [%{"bearerAuth" => []}]

  operation :mine,
    summary: "List the current user's requests to add a plant",
    responses: [ok: API.list(TaxonRequest, "Own requests, newest first")]

  def mine(conn, _params) do
    json(conn, %{data: Requests.list_mine(conn.assigns.current_user)})
  end

  operation :create,
    summary: "Ask for a plant to be added to the reference list",
    description:
      "At least one of `common_name` / `scientific_name` is required. If an open request " <>
        "already exists for the same name it is returned instead of creating a duplicate. " <>
        "Taxon managers (admins, taxon editors) are notified.",
    request_body: {"Request attributes", "application/json", %OpenApiSpex.Schema{type: :object}},
    responses: [created: API.object(TaxonRequest, "The open request")]

  def create(conn, %{"taxon_request" => attrs}) do
    with {:ok, request} <- Requests.create(conn.assigns.current_user, attrs) do
      conn |> put_status(:created) |> json(%{data: request})
    end
  end
end
