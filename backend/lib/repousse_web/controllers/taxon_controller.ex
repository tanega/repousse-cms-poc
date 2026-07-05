defmodule RepousseWeb.TaxonController do
  use RepousseWeb, :controller
  use OpenApiSpex.ControllerSpecs

  action_fallback RepousseWeb.FallbackController

  alias OpenApiSpex.Schema
  alias Repousse.Taxa

  # Read-only: any authenticated user can browse/search/consult taxa
  # (US-TAX-10, US-TAX-11). Mutations live under `Admin.TaxonController`,
  # gated by `Repousse.Taxa.Policy`.

  @taxon_schema %Schema{
    type: :object,
    properties: %{
      id: %Schema{type: :string, format: :uuid},
      scientific_name: %Schema{type: :string, nullable: true},
      common_name: %Schema{type: :string},
      taxonomic_level: %Schema{
        type: :string,
        enum: ["genus", "species", "variety"],
        nullable: true
      },
      is_non_taxonomic: %Schema{type: :boolean},
      notes: %Schema{type: :string, nullable: true},
      parent_id: %Schema{type: :string, format: :uuid, nullable: true},
      category_id: %Schema{type: :string, format: :uuid, nullable: true}
    }
  }

  operation(:index,
    summary: "List/search taxa",
    description:
      "US-TAX-10 — accessible to any authenticated user; `q` searches scientific and common name.",
    parameters: [q: [in: :query, type: :string, required: false]],
    responses: [
      ok:
        {"Taxa", "application/json",
         %Schema{type: :object, properties: %{data: %Schema{type: :array, items: @taxon_schema}}}}
    ]
  )

  def index(conn, %{"q" => q}) do
    taxa = Taxa.search_taxa(q)
    json(conn, %{data: taxa})
  end

  def index(conn, _params) do
    taxa = Taxa.list_taxa()
    json(conn, %{data: taxa})
  end

  operation(:show,
    summary: "Get a taxon's detail sheet",
    description:
      "US-TAX-11 — hierarchy, category, and external links. Accessible to any authenticated user.",
    parameters: [id: [in: :path, type: :string, required: true]],
    responses: [
      ok:
        {"Taxon", "application/json", %Schema{type: :object, properties: %{data: @taxon_schema}}},
      not_found: {"Not found", "application/json", %Schema{type: :object}}
    ]
  )

  def show(conn, %{"id" => id}) do
    taxon = Taxa.get_taxon!(id)
    json(conn, %{data: taxon})
  end
end
