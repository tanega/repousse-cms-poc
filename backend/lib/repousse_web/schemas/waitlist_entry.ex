defmodule RepousseWeb.Schemas.WaitlistEntry do
  @moduledoc false
  require OpenApiSpex
  alias OpenApiSpex.Schema

  OpenApiSpex.schema(
    %{
      title: "WaitlistEntry",
      type: :object,
      properties: %{
        id: %Schema{type: :string, format: :uuid},
        position: %Schema{type: :integer},
        notified_at: %Schema{type: :string, format: "date-time", nullable: true},
        notification_expires_at: %Schema{type: :string, format: "date-time", nullable: true},
        status: %Schema{type: :string, enum: ["waiting", "notified", "expired", "converted"]},
        user_id: %Schema{type: :string, format: :uuid},
        event_id: %Schema{type: :string, format: :uuid},
        taxon_id: %Schema{type: :string, format: :uuid},
        inserted_at: %Schema{type: :string, format: "date-time"},
        updated_at: %Schema{type: :string, format: "date-time"}
      },
      required: [:id, :position, :status, :user_id, :event_id, :taxon_id],
      example: %{
        "id" => "81b2c3d4-0000-4000-8000-000000000000",
        "position" => 1,
        "notified_at" => nil,
        "notification_expires_at" => nil,
        "status" => "waiting",
        "user_id" => "a1b2c3d4-0000-4000-8000-000000000000",
        "event_id" => "31b2c3d4-0000-4000-8000-000000000000",
        "taxon_id" => "21b2c3d4-0000-4000-8000-000000000000",
        "inserted_at" => "2026-01-15T10:00:00Z",
        "updated_at" => "2026-01-15T10:00:00Z"
      }
    },
    struct?: false
  )
end
