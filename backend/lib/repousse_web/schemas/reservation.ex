defmodule RepousseWeb.Schemas.Reservation do
  @moduledoc false
  require OpenApiSpex
  alias OpenApiSpex.Schema

  OpenApiSpex.schema(
    %{
      title: "Reservation",
      type: :object,
      properties: %{
        id: %Schema{type: :string, format: :uuid},
        status: %Schema{type: :string, enum: ["confirmed", "cancelled", "no_show", "validated"]},
        cancelled_at: %Schema{type: :string, format: "date-time", nullable: true},
        validated_at: %Schema{type: :string, format: "date-time", nullable: true},
        coordinator_note: %Schema{type: :string, nullable: true},
        user_id: %Schema{type: :string, format: :uuid},
        slot_id: %Schema{type: :string, format: :uuid},
        event_id: %Schema{type: :string, format: :uuid},
        project_id: %Schema{type: :string, format: :uuid},
        inserted_at: %Schema{type: :string, format: "date-time"},
        updated_at: %Schema{type: :string, format: "date-time"}
      },
      required: [:id, :status, :user_id, :slot_id, :event_id, :project_id],
      example: %{
        "id" => "61b2c3d4-0000-4000-8000-000000000000",
        "status" => "confirmed",
        "cancelled_at" => nil,
        "validated_at" => nil,
        "coordinator_note" => nil,
        "user_id" => "a1b2c3d4-0000-4000-8000-000000000000",
        "slot_id" => "41b2c3d4-0000-4000-8000-000000000000",
        "event_id" => "31b2c3d4-0000-4000-8000-000000000000",
        "project_id" => "c1b2c3d4-0000-4000-8000-000000000000",
        "inserted_at" => "2026-01-15T10:00:00Z",
        "updated_at" => "2026-01-15T10:00:00Z"
      }
    },
    struct?: false
  )
end
