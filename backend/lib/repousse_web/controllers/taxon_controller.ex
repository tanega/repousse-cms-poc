defmodule RepousseWeb.TaxonController do
  use RepousseWeb, :controller
  use OpenApiSpex.ControllerSpecs
  action_fallback RepousseWeb.FallbackController

  alias Repousse.Taxa
  alias RepousseWeb.OpenApiHelpers, as: API
  alias RepousseWeb.Schemas.Taxon

  tags ["Taxa"]
  security [%{"bearerAuth" => []}]

  operation :index,
    summary: "List or search taxa",
    parameters: [
      q: [in: :query, type: :string, required: false, description: "Search query"]
    ],
    responses: [ok: API.list(Taxon, "Taxa")]

  def index(conn, %{"q" => q}) do
    taxa = Taxa.search_taxa(q)
    json(conn, %{data: taxa})
  end

  def index(conn, _params) do
    taxa = Taxa.list_taxa()
    json(conn, %{data: taxa})
  end

  operation :show,
    summary: "Get a taxon",
    parameters: [id: [in: :path, type: :string, description: "Taxon ID"]],
    responses: [ok: API.object(Taxon, "Taxon")]

  def show(conn, %{"id" => id}) do
    taxon = Taxa.get_taxon!(id)
    json(conn, %{data: taxon})
  end

  operation :create,
    summary: "Create a taxon",
    request_body: {"Taxon attributes", "application/json", %OpenApiSpex.Schema{type: :object}},
    responses: [created: API.object(Taxon, "Created taxon")]

  def create(conn, %{"taxon" => params}) do
    with {:ok, taxon} <- Taxa.create_taxon(params) do
      conn |> put_status(:created) |> json(%{data: taxon})
    end
  end

  operation :update,
    summary: "Update a taxon",
    parameters: [id: [in: :path, type: :string, description: "Taxon ID"]],
    request_body: {"Taxon attributes", "application/json", %OpenApiSpex.Schema{type: :object}},
    responses: [ok: API.object(Taxon, "Updated taxon")]

  def update(conn, %{"id" => id, "taxon" => params}) do
    taxon = Taxa.get_taxon!(id)
    user = conn.assigns.current_user

    with {:ok, updated} <- Taxa.update_taxon(taxon, params, user) do
      json(conn, %{data: updated})
    end
  end

  operation :delete,
    summary: "Delete a taxon",
    parameters: [id: [in: :path, type: :string, description: "Taxon ID"]],
    responses: [no_content: API.no_content()]

  def delete(conn, %{"id" => id}) do
    taxon = Taxa.get_taxon!(id)

    with {:ok, _} <- Taxa.delete_taxon(taxon) do
      send_resp(conn, :no_content, "")
    end
  end
end
