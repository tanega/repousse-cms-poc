defmodule RepousseWeb.Schemas.Stock do
  @moduledoc false
  require OpenApiSpex
  alias OpenApiSpex.Schema

  OpenApiSpex.schema(
    %{
      title: "Stock",
      description: "Available quantity of a taxon at a distribution event",
      type: :object,
      properties: %{
        id: %Schema{type: :string, format: :uuid},
        quantity: %Schema{type: :integer, nullable: true},
        quantity_unknown: %Schema{type: :boolean},
        reserved_quantity: %Schema{type: :integer},
        event_id: %Schema{type: :string, format: :uuid},
        taxon_id: %Schema{type: :string, format: :uuid},
        inserted_at: %Schema{type: :string, format: "date-time"},
        updated_at: %Schema{type: :string, format: "date-time"}
      },
      required: [:id, :event_id, :taxon_id],
      example: %{
        "id" => "51b2c3d4-0000-4000-8000-000000000000",
        "quantity" => 50,
        "quantity_unknown" => false,
        "reserved_quantity" => 12,
        "event_id" => "31b2c3d4-0000-4000-8000-000000000000",
        "taxon_id" => "21b2c3d4-0000-4000-8000-000000000000",
        "inserted_at" => "2026-01-15T10:00:00Z",
        "updated_at" => "2026-01-15T10:00:00Z"
      }
    },
    struct?: false
  )
end
