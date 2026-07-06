defmodule RepousseWeb.Schemas.Taxon do
  @moduledoc false
  require OpenApiSpex
  alias OpenApiSpex.Schema

  OpenApiSpex.schema(
    %{
      title: "Taxon",
      type: :object,
      properties: %{
        id: %Schema{type: :string, format: :uuid},
        scientific_name: %Schema{type: :string, nullable: true},
        common_name: %Schema{type: :string},
        taxonomic_level: %Schema{type: :string, enum: ["genus", "species", "variety"], nullable: true},
        is_non_taxonomic: %Schema{type: :boolean},
        notes: %Schema{type: :string, nullable: true},
        parent_id: %Schema{type: :string, format: :uuid, nullable: true},
        category_id: %Schema{type: :string, format: :uuid, nullable: true},
        inserted_at: %Schema{type: :string, format: "date-time"},
        updated_at: %Schema{type: :string, format: "date-time"}
      },
      required: [:id, :common_name],
      example: %{
        "id" => "21b2c3d4-0000-4000-8000-000000000000",
        "scientific_name" => "Prunus avium",
        "common_name" => "Merisier",
        "taxonomic_level" => "species",
        "is_non_taxonomic" => false,
        "notes" => nil,
        "parent_id" => nil,
        "category_id" => nil,
        "inserted_at" => "2026-01-15T10:00:00Z",
        "updated_at" => "2026-01-15T10:00:00Z"
      }
    },
    struct?: false
  )
end
