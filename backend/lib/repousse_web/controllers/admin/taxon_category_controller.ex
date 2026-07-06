defmodule RepousseWeb.Admin.TaxonCategoryController do
  use RepousseWeb, :controller
  use OpenApiSpex.ControllerSpecs
  action_fallback RepousseWeb.FallbackController

  alias Repousse.Taxa
  alias RepousseWeb.OpenApiHelpers, as: API
  alias RepousseWeb.Schemas.TaxonCategory

  tags ["Admin — Taxa"]
  security [%{"bearerAuth" => []}]

  operation :index,
    summary: "List taxon categories (admin)",
    responses: [ok: API.list(TaxonCategory, "Taxon categories")]

  def index(conn, _params), do: json(conn, %{data: Taxa.list_taxon_categories()})

  operation :create,
    summary: "Create a taxon category (admin)",
    request_body: {"Taxon category attributes", "application/json", %OpenApiSpex.Schema{type: :object}},
    responses: [created: API.object(TaxonCategory, "Created taxon category")]

  def create(conn, %{"taxon_category" => params}) do
    with {:ok, category} <- Taxa.create_taxon_category(params) do
      conn |> put_status(:created) |> json(%{data: category})
    end
  end

  operation :update,
    summary: "Update a taxon category (admin)",
    parameters: [id: [in: :path, type: :string, description: "Taxon category ID"]],
    request_body: {"Taxon category attributes", "application/json", %OpenApiSpex.Schema{type: :object}},
    responses: [ok: API.object(TaxonCategory, "Updated taxon category")]

  def update(conn, %{"id" => id, "taxon_category" => params}) do
    category = Taxa.get_taxon_category!(id)
    with {:ok, updated} <- Taxa.update_taxon_category(category, params), do: json(conn, %{data: updated})
  end

  operation :delete,
    summary: "Delete a taxon category (admin)",
    parameters: [id: [in: :path, type: :string, description: "Taxon category ID"]],
    responses: [no_content: API.no_content()]

  def delete(conn, %{"id" => id}) do
    category = Taxa.get_taxon_category!(id)
    with {:ok, _} <- Repousse.Repo.delete(category), do: send_resp(conn, :no_content, "")
  end
end
