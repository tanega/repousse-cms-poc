defmodule RepousseWeb.Schemas.UserProfile do
  @moduledoc false
  require OpenApiSpex
  alias OpenApiSpex.Schema
  alias RepousseWeb.Schemas.HostedSpecies

  OpenApiSpex.schema(
    %{
      title: "UserProfile",
      type: :object,
      properties: %{
        id: %Schema{type: :string, format: :uuid},
        profile_type: %Schema{type: :string, enum: ["volunteer", "adoptant", "host_family"]},
        status: %Schema{type: :string, enum: ["pending", "active", "rejected"]},
        requested_at: %Schema{type: :string, format: "date-time", nullable: true},
        decided_at: %Schema{type: :string, format: "date-time", nullable: true},
        rejection_reason: %Schema{type: :string, nullable: true},
        engagement_note: %Schema{type: :string, nullable: true},
        address: %Schema{type: :string, nullable: true},
        avatar_url: %Schema{type: :string, nullable: true},
        notification_prefs: %Schema{type: :object},
        hosting_capacity: %Schema{type: :integer, nullable: true},
        hosting_address: %Schema{type: :string, nullable: true},
        hosting_lat: %Schema{type: :number, format: :float, nullable: true},
        hosting_lng: %Schema{type: :number, format: :float, nullable: true},
        hosting_availability: %Schema{type: :string, nullable: true},
        hosting_surface_m2: %Schema{type: :number, format: :float, nullable: true},
        hosting_equipment: %Schema{
          type: :array,
          items: %Schema{
            type: :string,
            enum: [
              "greenhouse",
              "tarp",
              "auto_watering",
              "artificial_light",
              "cold_frame",
              "outdoor_ground"
            ]
          }
        },
        hosting_phone: %Schema{
          type: :string,
          nullable: true,
          description: "E.164. Only returned to the member and coordinators"
        },
        hosted_species: %Schema{type: :array, items: HostedSpecies},
        inserted_at: %Schema{type: :string, format: "date-time"},
        updated_at: %Schema{type: :string, format: "date-time"}
      },
      required: [:id, :profile_type],
      example: %{
        "id" => "b1b2c3d4-0000-4000-8000-000000000000",
        "profile_type" => "adoptant",
        "status" => "active",
        "requested_at" => nil,
        "decided_at" => nil,
        "rejection_reason" => nil,
        "engagement_note" => nil,
        "address" => nil,
        "avatar_url" => nil,
        "notification_prefs" => %{},
        "hosting_capacity" => nil,
        "hosting_address" => nil,
        "hosting_lat" => nil,
        "hosting_lng" => nil,
        "hosting_availability" => nil,
        "hosting_surface_m2" => nil,
        "hosting_equipment" => [],
        "hosting_phone" => nil,
        "hosted_species" => [],
        "inserted_at" => "2026-01-15T10:00:00Z",
        "updated_at" => "2026-01-15T10:00:00Z"
      }
    },
    struct?: false
  )
end
