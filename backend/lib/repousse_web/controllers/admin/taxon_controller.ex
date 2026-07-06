defmodule RepousseWeb.Admin.TaxonController do
  use RepousseWeb, :controller
  use OpenApiSpex.ControllerSpecs
  action_fallback RepousseWeb.FallbackController

  alias Repousse.Taxa
  alias RepousseWeb.OpenApiHelpers, as: API

  tags ["Admin — Taxa"]
  security [%{"bearerAuth" => []}]

  operation :index,
    summary: "List or search taxa (admin)",
    parameters: [
      q: [in: :query, type: :string, required: false, description: "Search query"]
    ],
    responses: [ok: API.list("Taxa")]

  def index(conn, %{"q" => q}), do: json(conn, %{data: Taxa.search_taxa(q)})
  def index(conn, _params), do: json(conn, %{data: Taxa.list_taxa()})

  operation :show,
    summary: "Get a taxon (admin)",
    parameters: [id: [in: :path, type: :string, description: "Taxon ID"]],
    responses: [ok: API.object("Taxon")]

  def show(conn, %{"id" => id}), do: json(conn, %{data: Taxa.get_taxon!(id)})

  operation :create,
    summary: "Create a taxon (admin)",
    request_body: {"Taxon attributes", "application/json", %OpenApiSpex.Schema{type: :object}},
    responses: [created: API.object("Created taxon")]

  def create(conn, %{"taxon" => params}) do
    with {:ok, taxon} <- Taxa.create_taxon(params) do
      conn |> put_status(:created) |> json(%{data: taxon})
    end
  end

  operation :update,
    summary: "Update a taxon (admin)",
    parameters: [id: [in: :path, type: :string, description: "Taxon ID"]],
    request_body: {"Taxon attributes", "application/json", %OpenApiSpex.Schema{type: :object}},
    responses: [ok: API.object("Updated taxon")]

  def update(conn, %{"id" => id, "taxon" => params}) do
    taxon = Taxa.get_taxon!(id)
    user = conn.assigns.current_user
    with {:ok, updated} <- Taxa.update_taxon(taxon, params, user), do: json(conn, %{data: updated})
  end

  operation :delete,
    summary: "Delete a taxon (admin)",
    parameters: [id: [in: :path, type: :string, description: "Taxon ID"]],
    responses: [no_content: API.no_content()]

  def delete(conn, %{"id" => id}) do
    taxon = Taxa.get_taxon!(id)
    with {:ok, _} <- Taxa.delete_taxon(taxon), do: send_resp(conn, :no_content, "")
  end

  operation :versions,
    summary: "List a taxon's version history (admin)",
    parameters: [id: [in: :path, type: :string, description: "Taxon ID"]],
    responses: [ok: API.list("Taxon versions")]

  def versions(conn, %{"id" => id}) do
    versions = Taxa.list_taxon_versions(id)
    json(conn, %{data: versions})
  end

  operation :restore,
    summary: "Restore a taxon to a previous version (admin)",
    parameters: [
      id: [in: :path, type: :string, description: "Taxon ID"],
      version_id: [in: :path, type: :string, description: "Taxon version ID"]
    ],
    responses: [ok: API.object("Restored taxon")]

  def restore(conn, %{"version_id" => version_id}) do
    version = Repousse.Repo.get!(Repousse.Taxa.TaxonVersion, version_id)
    user = conn.assigns.current_user

    with {:ok, restored} <- Taxa.restore_version(version, user), do: json(conn, %{data: restored})
  end
end
