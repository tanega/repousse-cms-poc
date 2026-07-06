defmodule RepousseWeb.Schemas.TaxonVersion do
  @moduledoc false
  require OpenApiSpex
  alias OpenApiSpex.Schema

  OpenApiSpex.schema(
    %{
      title: "TaxonVersion",
      description: "A snapshot of a taxon's fields before an edit, for restore",
      type: :object,
      properties: %{
        id: %Schema{type: :string, format: :uuid},
        changes: %Schema{type: :object},
        snapshot: %Schema{type: :object},
        taxon_id: %Schema{type: :string, format: :uuid},
        changed_by_id: %Schema{type: :string, format: :uuid},
        inserted_at: %Schema{type: :string, format: "date-time"},
        updated_at: %Schema{type: :string, format: "date-time"}
      },
      required: [:id, :changes, :snapshot, :taxon_id, :changed_by_id],
      example: %{
        "id" => "a1b2c3d4-0001-4000-8000-000000000000",
        "changes" => %{"common_name" => "Merisier sauvage"},
        "snapshot" => %{"common_name" => "Merisier"},
        "taxon_id" => "21b2c3d4-0000-4000-8000-000000000000",
        "changed_by_id" => "a1b2c3d4-0000-4000-8000-000000000000",
        "inserted_at" => "2026-01-15T10:00:00Z",
        "updated_at" => "2026-01-15T10:00:00Z"
      }
    },
    struct?: false
  )
end
