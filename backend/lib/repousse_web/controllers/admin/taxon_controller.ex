defmodule RepousseWeb.Admin.TaxonController do
  use RepousseWeb, :controller
  use OpenApiSpex.ControllerSpecs

  action_fallback RepousseWeb.FallbackController

  alias OpenApiSpex.Schema
  alias Repousse.Taxa
  alias Repousse.Taxa.Policy

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

  @taxon_params %Schema{
    type: :object,
    properties: %{
      taxon: %Schema{
        type: :object,
        properties: %{
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
          category_id: %Schema{type: :string, format: :uuid, nullable: true},
          external_links: %Schema{
            type: :array,
            items: %Schema{
              type: :object,
              properties: %{
                source_name: %Schema{type: :string},
                url: %Schema{type: :string}
              }
            }
          }
        }
      }
    }
  }

  operation(:index,
    summary: "List taxa (admin)",
    description: "US-TAX-10 — supports `q` search on scientific/common name.",
    parameters: [q: [in: :query, type: :string, required: false]],
    responses: [
      ok:
        {"Taxa", "application/json",
         %Schema{type: :object, properties: %{data: %Schema{type: :array, items: @taxon_schema}}}}
    ]
  )

  def index(conn, %{"q" => q}), do: json(conn, %{data: Taxa.search_taxa(q)})
  def index(conn, _params), do: json(conn, %{data: Taxa.list_taxa()})

  operation(:show,
    summary: "Get a taxon (admin)",
    description: "US-TAX-11 — full detail including hierarchy and external links.",
    parameters: [id: [in: :path, type: :string, required: true]],
    responses: [
      ok:
        {"Taxon", "application/json", %Schema{type: :object, properties: %{data: @taxon_schema}}},
      not_found: {"Not found", "application/json", %Schema{type: :object}}
    ]
  )

  def show(conn, %{"id" => id}), do: json(conn, %{data: Taxa.get_taxon!(id)})

  operation(:create,
    summary: "Create a taxon",
    description: "US-TAX-02 — Admin or taxon_editor only.",
    request_body: {"Taxon params", "application/json", @taxon_params},
    responses: [
      created:
        {"Taxon", "application/json", %Schema{type: :object, properties: %{data: @taxon_schema}}},
      forbidden: {"Forbidden", "application/json", %Schema{type: :object}},
      unprocessable_entity: {"Validation failed", "application/json", %Schema{type: :object}}
    ]
  )

  def create(conn, %{"taxon" => params}) do
    with :ok <- Bodyguard.permit(Policy, :manage_taxa, conn.assigns.current_user, %{}),
         {:ok, taxon} <- Taxa.create_taxon(params) do
      conn |> put_status(:created) |> json(%{data: taxon})
    end
  end

  operation(:update,
    summary: "Update a taxon",
    description: "US-TAX-04 — every change is versioned. Admin or taxon_editor only.",
    parameters: [id: [in: :path, type: :string, required: true]],
    request_body: {"Taxon params", "application/json", @taxon_params},
    responses: [
      ok:
        {"Taxon", "application/json", %Schema{type: :object, properties: %{data: @taxon_schema}}},
      forbidden: {"Forbidden", "application/json", %Schema{type: :object}},
      unprocessable_entity: {"Validation failed", "application/json", %Schema{type: :object}}
    ]
  )

  def update(conn, %{"id" => id, "taxon" => params}) do
    user = conn.assigns.current_user

    with :ok <- Bodyguard.permit(Policy, :manage_taxa, user, %{}) do
      taxon = Taxa.get_taxon!(id)

      with {:ok, updated} <- Taxa.update_taxon(taxon, params, user),
           do: json(conn, %{data: updated})
    end
  end

  operation(:delete,
    summary: "Delete a taxon",
    description:
      "US-TAX-06 — blocked if the taxon has children or is referenced by a stock/project. Admin or taxon_editor only.",
    parameters: [id: [in: :path, type: :string, required: true]],
    responses: [
      no_content: {"Deleted", "application/json", %Schema{type: :object}},
      forbidden: {"Forbidden", "application/json", %Schema{type: :object}},
      bad_request: {"Blocked by dependents", "application/json", %Schema{type: :object}}
    ]
  )

  def delete(conn, %{"id" => id}) do
    with :ok <- Bodyguard.permit(Policy, :manage_taxa, conn.assigns.current_user, %{}) do
      taxon = Taxa.get_taxon!(id)

      with {:ok, _} <- Taxa.delete_taxon(taxon), do: send_resp(conn, :no_content, "")
    end
  end

  operation(:versions,
    summary: "List a taxon's version history",
    description: "US-TAX-05 — consultable version history.",
    parameters: [id: [in: :path, type: :string, required: true]],
    responses: [
      ok:
        {"Versions", "application/json",
         %Schema{
           type: :object,
           properties: %{data: %Schema{type: :array, items: %Schema{type: :object}}}
         }}
    ]
  )

  def versions(conn, %{"id" => id}) do
    versions = Taxa.list_taxon_versions(id)
    json(conn, %{data: versions})
  end

  operation(:restore,
    summary: "Restore a prior taxon version",
    description:
      "US-TAX-05 — restoring creates a new version rather than overwriting silently. Admin or taxon_editor only.",
    parameters: [
      id: [in: :path, type: :string, required: true],
      version_id: [in: :path, type: :string, required: true]
    ],
    responses: [
      ok:
        {"Taxon", "application/json", %Schema{type: :object, properties: %{data: @taxon_schema}}},
      forbidden: {"Forbidden", "application/json", %Schema{type: :object}}
    ]
  )

  def restore(conn, %{"version_id" => version_id}) do
    user = conn.assigns.current_user

    with :ok <- Bodyguard.permit(Policy, :manage_taxa, user, %{}) do
      version = Repousse.Repo.get!(Repousse.Taxa.TaxonVersion, version_id)

      with {:ok, restored} <- Taxa.restore_version(version, user),
           do: json(conn, %{data: restored})
    end
  end
end
