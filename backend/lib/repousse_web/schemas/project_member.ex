defmodule RepousseWeb.Schemas.ProjectMember do
  @moduledoc false
  require OpenApiSpex
  alias OpenApiSpex.Schema
  alias RepousseWeb.Schemas.User

  OpenApiSpex.schema(
    %{
      title: "ProjectMember",
      type: :object,
      properties: %{
        id: %Schema{type: :string, format: :uuid},
        role: %Schema{type: :string, enum: ["admin", "editor", "reader"]},
        joined_at: %Schema{type: :string, format: "date-time", nullable: true},
        project_id: %Schema{type: :string, format: :uuid},
        user_id: %Schema{type: :string, format: :uuid},
        user: User,
        inserted_at: %Schema{type: :string, format: "date-time"},
        updated_at: %Schema{type: :string, format: "date-time"}
      },
      required: [:id, :role, :project_id, :user_id],
      example: %{
        "id" => "d1b2c3d4-0000-4000-8000-000000000000",
        "role" => "reader",
        "joined_at" => "2026-01-15T10:00:00Z",
        "project_id" => "c1b2c3d4-0000-4000-8000-000000000000",
        "user_id" => "a1b2c3d4-0000-4000-8000-000000000000",
        "inserted_at" => "2026-01-15T10:00:00Z",
        "updated_at" => "2026-01-15T10:00:00Z"
      }
    },
    struct?: false
  )
end
