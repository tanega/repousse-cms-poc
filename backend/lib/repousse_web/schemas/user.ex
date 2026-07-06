defmodule RepousseWeb.Schemas.User do
  @moduledoc false
  require OpenApiSpex
  alias OpenApiSpex.Schema
  alias RepousseWeb.Schemas.UserProfile

  OpenApiSpex.schema(
    %{
      title: "User",
      type: :object,
      properties: %{
        id: %Schema{type: :string, format: :uuid},
        email: %Schema{type: :string, format: :email},
        first_name: %Schema{type: :string},
        last_name: %Schema{type: :string},
        membership_year: %Schema{type: :integer, nullable: true},
        adhesion_active: %Schema{type: :boolean},
        status: %Schema{type: :string, enum: ["active", "suspended"]},
        role: %Schema{type: :string, enum: ["member", "admin", "superadmin"]},
        taxon_editor: %Schema{type: :boolean},
        last_seen_at: %Schema{type: :string, format: "date-time", nullable: true},
        profiles: %Schema{type: :array, items: UserProfile},
        inserted_at: %Schema{type: :string, format: "date-time"},
        updated_at: %Schema{type: :string, format: "date-time"}
      },
      required: [:id, :email],
      example: %{
        "id" => "a1b2c3d4-0000-4000-8000-000000000000",
        "email" => "alice@example.com",
        "first_name" => "Alice",
        "last_name" => "Dupont",
        "membership_year" => 2026,
        "adhesion_active" => true,
        "status" => "active",
        "role" => "member",
        "taxon_editor" => false,
        "last_seen_at" => "2026-07-06T09:00:00Z",
        "profiles" => [],
        "inserted_at" => "2026-01-15T10:00:00Z",
        "updated_at" => "2026-01-15T10:00:00Z"
      }
    },
    struct?: false
  )
end
