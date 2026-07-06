defmodule RepousseWeb.Schemas.ProjectInvitation do
  @moduledoc false
  require OpenApiSpex
  alias OpenApiSpex.Schema

  OpenApiSpex.schema(
    %{
      title: "ProjectInvitation",
      type: :object,
      properties: %{
        id: %Schema{type: :string, format: :uuid},
        email: %Schema{type: :string, format: :email},
        role: %Schema{type: :string, enum: ["editor", "reader"]},
        token: %Schema{type: :string},
        project_id: %Schema{type: :string, format: :uuid},
        invited_by_id: %Schema{type: :string, format: :uuid},
        accepted_at: %Schema{type: :string, format: "date-time", nullable: true},
        expires_at: %Schema{type: :string, format: "date-time"},
        inserted_at: %Schema{type: :string, format: "date-time"},
        updated_at: %Schema{type: :string, format: "date-time"}
      },
      required: [:id, :email, :role, :project_id],
      example: %{
        "id" => "e1b2c3d4-0000-4000-8000-000000000000",
        "email" => "invitee@example.com",
        "role" => "editor",
        "token" => "uRoh9lUqvtN_Vy5Oo9_BuLlA50NMtwZekYAdYPmn6JE",
        "project_id" => "c1b2c3d4-0000-4000-8000-000000000000",
        "invited_by_id" => "a1b2c3d4-0000-4000-8000-000000000000",
        "accepted_at" => nil,
        "expires_at" => "2026-01-22T10:00:00Z",
        "inserted_at" => "2026-01-15T10:00:00Z",
        "updated_at" => "2026-01-15T10:00:00Z"
      }
    },
    struct?: false
  )
end
