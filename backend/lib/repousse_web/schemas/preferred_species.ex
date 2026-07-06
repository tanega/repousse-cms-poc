defmodule RepousseWeb.Schemas.PreferredSpecies do
  @moduledoc false
  require OpenApiSpex
  alias OpenApiSpex.Schema

  OpenApiSpex.schema(
    %{
      title: "PreferredSpecies",
      type: :object,
      properties: %{
        id: %Schema{type: :string, format: :uuid},
        project_id: %Schema{type: :string, format: :uuid},
        taxon_id: %Schema{type: :string, format: :uuid},
        inserted_at: %Schema{type: :string, format: "date-time"},
        updated_at: %Schema{type: :string, format: "date-time"}
      },
      required: [:id, :project_id, :taxon_id],
      example: %{
        "id" => "11b2c3d4-0000-4000-8000-000000000000",
        "project_id" => "c1b2c3d4-0000-4000-8000-000000000000",
        "taxon_id" => "21b2c3d4-0000-4000-8000-000000000000",
        "inserted_at" => "2026-01-15T10:00:00Z",
        "updated_at" => "2026-01-15T10:00:00Z"
      }
    },
    struct?: false
  )
end
