defmodule RepousseWeb.Schemas.Nursery do
  @moduledoc false
  require OpenApiSpex
  alias OpenApiSpex.Schema
  alias RepousseWeb.Schemas.NurseryPlant

  OpenApiSpex.schema(
    %{
      title: "Nursery",
      type: :object,
      properties: %{
        id: %Schema{type: :string, format: :uuid},
        user_id: %Schema{type: :string, format: :uuid},
        name: %Schema{type: :string},
        notes: %Schema{type: :string, nullable: true},
        address: %Schema{type: :string, nullable: true},
        lat: %Schema{type: :number, format: :float, nullable: true},
        lng: %Schema{type: :number, format: :float, nullable: true},
        archived_at: %Schema{type: :string, format: "date-time", nullable: true},
        plants: %Schema{type: :array, items: NurseryPlant},
        inserted_at: %Schema{type: :string, format: "date-time"},
        updated_at: %Schema{type: :string, format: "date-time"}
      },
      required: [:id, :name, :user_id],
      example: %{
        "id" => "d1d2d3d4-0000-4000-8000-000000000000",
        "user_id" => "a1a2a3a4-0000-4000-8000-000000000000",
        "name" => "Serre du jardin",
        "notes" => "Arrosage automatique, exposition sud.",
        "address" => "12 rue des Lilas, 75020 Paris",
        "lat" => 48.8674,
        "lng" => 2.3987,
        "archived_at" => nil,
        "plants" => [],
        "inserted_at" => "2026-01-15T10:00:00Z",
        "updated_at" => "2026-01-15T10:00:00Z"
      }
    },
    struct?: false
  )
end
