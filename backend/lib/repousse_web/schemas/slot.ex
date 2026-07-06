defmodule RepousseWeb.Schemas.Slot do
  @moduledoc false
  require OpenApiSpex
  alias OpenApiSpex.Schema

  OpenApiSpex.schema(
    %{
      title: "Slot",
      description: "A time slot at a distribution event",
      type: :object,
      properties: %{
        id: %Schema{type: :string, format: :uuid},
        location_name: %Schema{type: :string},
        address: %Schema{type: :string, nullable: true},
        date: %Schema{type: :string, format: :date},
        start_time: %Schema{type: :string, format: :time},
        end_time: %Schema{type: :string, format: :time},
        contact: %Schema{type: :string, nullable: true},
        event_id: %Schema{type: :string, format: :uuid},
        inserted_at: %Schema{type: :string, format: "date-time"},
        updated_at: %Schema{type: :string, format: "date-time"}
      },
      required: [:id, :location_name, :date, :start_time, :end_time, :event_id],
      example: %{
        "id" => "41b2c3d4-0000-4000-8000-000000000000",
        "location_name" => "Parking de la mairie",
        "address" => nil,
        "date" => "2026-03-14",
        "start_time" => "09:00:00",
        "end_time" => "12:00:00",
        "contact" => nil,
        "event_id" => "31b2c3d4-0000-4000-8000-000000000000",
        "inserted_at" => "2026-01-15T10:00:00Z",
        "updated_at" => "2026-01-15T10:00:00Z"
      }
    },
    struct?: false
  )
end
