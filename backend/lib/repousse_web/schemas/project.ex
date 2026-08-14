defmodule RepousseWeb.Schemas.Project do
  @moduledoc false
  require OpenApiSpex
  alias OpenApiSpex.Schema

  OpenApiSpex.schema(
    %{
      title: "Project",
      type: :object,
      properties: %{
        id: %Schema{type: :string, format: :uuid},
        name: %Schema{type: :string},
        description: %Schema{type: :string, nullable: true},
        management_type: %Schema{type: :string, enum: ["individual", "collective"]},
        address: %Schema{type: :string, nullable: true},
        lat: %Schema{type: :number, format: :float, nullable: true},
        lng: %Schema{type: :number, format: :float, nullable: true},
        surface_m2: %Schema{type: :number, format: :float, nullable: true},
        soil_type: %Schema{type: :string, nullable: true},
        publication_status: %Schema{type: :string, enum: ["private", "public", "unpublished"]},
        published_at: %Schema{type: :string, format: "date-time", nullable: true},
        archived_at: %Schema{type: :string, format: "date-time", nullable: true},
        owner_id: %Schema{type: :string, format: :uuid, nullable: true},
        cover_image_url: %Schema{type: :string, nullable: true},
        inserted_at: %Schema{type: :string, format: "date-time"},
        updated_at: %Schema{type: :string, format: "date-time"}
      },
      required: [:id, :name],
      example: %{
        "id" => "c1b2c3d4-0000-4000-8000-000000000000",
        "name" => "Verger partagé du Clos",
        "description" => "Un projet de plantation collectif",
        "management_type" => "collective",
        "address" => nil,
        "lat" => nil,
        "lng" => nil,
        "surface_m2" => nil,
        "soil_type" => nil,
        "publication_status" => "private",
        "published_at" => nil,
        "archived_at" => nil,
        "owner_id" => "a1b2c3d4-0000-4000-8000-000000000000",
        "cover_image_url" => nil,
        "inserted_at" => "2026-01-15T10:00:00Z",
        "updated_at" => "2026-01-15T10:00:00Z"
      }
    },
    struct?: false
  )
end
