defmodule RepousseWeb.Schemas.NurseryPlant do
  @moduledoc false
  require OpenApiSpex
  alias OpenApiSpex.Schema

  OpenApiSpex.schema(
    %{
      title: "NurseryPlant",
      type: :object,
      properties: %{
        id: %Schema{type: :string, format: :uuid},
        nursery_id: %Schema{type: :string, format: :uuid},
        taxon_id: %Schema{type: :string, format: :uuid},
        quantity: %Schema{type: :integer},
        note: %Schema{type: :string, nullable: true},
        inserted_at: %Schema{type: :string, format: "date-time"},
        updated_at: %Schema{type: :string, format: "date-time"}
      },
      required: [:id, :taxon_id, :quantity],
      example: %{
        "id" => "e1e2e3e4-0000-4000-8000-000000000000",
        "nursery_id" => "d1d2d3d4-0000-4000-8000-000000000000",
        "taxon_id" => "c1c2c3c4-0000-4000-8000-000000000000",
        "quantity" => 24,
        "note" => "Semis de l'automne dernier",
        "inserted_at" => "2026-01-15T10:00:00Z",
        "updated_at" => "2026-01-15T10:00:00Z"
      }
    },
    struct?: false
  )
end
