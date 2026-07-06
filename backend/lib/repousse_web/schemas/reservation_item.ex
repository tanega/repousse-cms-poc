defmodule RepousseWeb.Schemas.ReservationItem do
  @moduledoc false
  require OpenApiSpex
  alias OpenApiSpex.Schema

  OpenApiSpex.schema(
    %{
      title: "ReservationItem",
      type: :object,
      properties: %{
        id: %Schema{type: :string, format: :uuid},
        reserved_qty: %Schema{type: :integer},
        distributed_qty: %Schema{type: :integer, nullable: true},
        reservation_id: %Schema{type: :string, format: :uuid},
        stock_id: %Schema{type: :string, format: :uuid},
        taxon_id: %Schema{type: :string, format: :uuid},
        inserted_at: %Schema{type: :string, format: "date-time"},
        updated_at: %Schema{type: :string, format: "date-time"}
      },
      required: [:id, :reserved_qty, :reservation_id, :stock_id, :taxon_id],
      example: %{
        "id" => "71b2c3d4-0000-4000-8000-000000000000",
        "reserved_qty" => 2,
        "distributed_qty" => nil,
        "reservation_id" => "61b2c3d4-0000-4000-8000-000000000000",
        "stock_id" => "51b2c3d4-0000-4000-8000-000000000000",
        "taxon_id" => "21b2c3d4-0000-4000-8000-000000000000",
        "inserted_at" => "2026-01-15T10:00:00Z",
        "updated_at" => "2026-01-15T10:00:00Z"
      }
    },
    struct?: false
  )
end
