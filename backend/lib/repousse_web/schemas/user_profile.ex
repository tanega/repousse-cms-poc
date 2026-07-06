defmodule RepousseWeb.Schemas.UserProfile do
  @moduledoc false
  require OpenApiSpex
  alias OpenApiSpex.Schema

  OpenApiSpex.schema(
    %{
      title: "UserProfile",
      type: :object,
      properties: %{
        id: %Schema{type: :string, format: :uuid},
        profile_type: %Schema{type: :string, enum: ["volunteer", "adoptant", "host_family"]},
        engagement_note: %Schema{type: :string, nullable: true},
        address: %Schema{type: :string, nullable: true},
        avatar_url: %Schema{type: :string, nullable: true},
        notification_prefs: %Schema{type: :object},
        hosting_capacity: %Schema{type: :integer, nullable: true},
        hosting_address: %Schema{type: :string, nullable: true},
        hosting_lat: %Schema{type: :number, format: :float, nullable: true},
        hosting_lng: %Schema{type: :number, format: :float, nullable: true},
        hosting_availability: %Schema{type: :string, nullable: true},
        inserted_at: %Schema{type: :string, format: "date-time"},
        updated_at: %Schema{type: :string, format: "date-time"}
      },
      required: [:id, :profile_type],
      example: %{
        "id" => "b1b2c3d4-0000-4000-8000-000000000000",
        "profile_type" => "adoptant",
        "engagement_note" => nil,
        "address" => nil,
        "avatar_url" => nil,
        "notification_prefs" => %{},
        "hosting_capacity" => nil,
        "hosting_address" => nil,
        "hosting_lat" => nil,
        "hosting_lng" => nil,
        "hosting_availability" => nil,
        "inserted_at" => "2026-01-15T10:00:00Z",
        "updated_at" => "2026-01-15T10:00:00Z"
      }
    },
    struct?: false
  )
end
