defmodule RepousseWeb.Admin.TaxonCategoryController do
  use RepousseWeb, :controller
  use OpenApiSpex.ControllerSpecs

  action_fallback RepousseWeb.FallbackController

  alias OpenApiSpex.Schema
  alias Repousse.Taxa
  alias Repousse.Taxa.Policy

  @category_schema %Schema{
    type: :object,
    properties: %{
      id: %Schema{type: :string, format: :uuid},
      name: %Schema{type: :string},
      slug: %Schema{type: :string}
    }
  }

  operation(:index,
    summary: "List taxon categories",
    description: "US-TAX-01 — the administrable category list.",
    responses: [
      ok:
        {"Categories", "application/json",
         %Schema{
           type: :object,
           properties: %{data: %Schema{type: :array, items: @category_schema}}
         }}
    ]
  )

  def index(conn, _params), do: json(conn, %{data: Taxa.list_taxon_categories()})

  operation(:create,
    summary: "Create a taxon category",
    description: "US-TAX-01 — Admin or taxon_editor only.",
    request_body:
      {"Category params", "application/json",
       %Schema{
         type: :object,
         properties: %{
           taxon_category: %Schema{type: :object, properties: %{name: %Schema{type: :string}}}
         }
       }},
    responses: [
      created:
        {"Category", "application/json",
         %Schema{type: :object, properties: %{data: @category_schema}}},
      forbidden: {"Forbidden", "application/json", %Schema{type: :object}},
      unprocessable_entity: {"Validation failed", "application/json", %Schema{type: :object}}
    ]
  )

  def create(conn, %{"taxon_category" => params}) do
    with :ok <- Bodyguard.permit(Policy, :manage_taxa, conn.assigns.current_user, %{}),
         {:ok, category} <- Taxa.create_taxon_category(params) do
      conn |> put_status(:created) |> json(%{data: category})
    end
  end

  operation(:update,
    summary: "Rename a taxon category",
    description: "US-TAX-01 — Admin or taxon_editor only.",
    parameters: [id: [in: :path, type: :string, required: true]],
    request_body:
      {"Category params", "application/json",
       %Schema{
         type: :object,
         properties: %{
           taxon_category: %Schema{type: :object, properties: %{name: %Schema{type: :string}}}
         }
       }},
    responses: [
      ok:
        {"Category", "application/json",
         %Schema{type: :object, properties: %{data: @category_schema}}},
      forbidden: {"Forbidden", "application/json", %Schema{type: :object}},
      unprocessable_entity: {"Validation failed", "application/json", %Schema{type: :object}}
    ]
  )

  def update(conn, %{"id" => id, "taxon_category" => params}) do
    with :ok <- Bodyguard.permit(Policy, :manage_taxa, conn.assigns.current_user, %{}) do
      category = Taxa.get_taxon_category!(id)

      with {:ok, updated} <- Taxa.update_taxon_category(category, params),
           do: json(conn, %{data: updated})
    end
  end

  operation(:delete,
    summary: "Delete a taxon category",
    description:
      "US-TAX-01 — blocked if any taxon still uses the category. Admin or taxon_editor only.",
    parameters: [id: [in: :path, type: :string, required: true]],
    responses: [
      no_content: {"Deleted", "application/json", %Schema{type: :object}},
      forbidden: {"Forbidden", "application/json", %Schema{type: :object}},
      bad_request: {"Blocked by dependents", "application/json", %Schema{type: :object}}
    ]
  )

  def delete(conn, %{"id" => id}) do
    with :ok <- Bodyguard.permit(Policy, :manage_taxa, conn.assigns.current_user, %{}) do
      category = Taxa.get_taxon_category!(id)

      with {:ok, _} <- Taxa.delete_taxon_category(category), do: send_resp(conn, :no_content, "")
    end
  end
end
