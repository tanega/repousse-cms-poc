defmodule RepousseWeb.Schemas.JournalEntry do
  @moduledoc false
  require OpenApiSpex
  alias OpenApiSpex.Schema

  OpenApiSpex.schema(
    %{
      title: "JournalEntry",
      type: :object,
      properties: %{
        id: %Schema{type: :string, format: :uuid},
        content: %Schema{type: :string},
        edited_at: %Schema{type: :string, format: "date-time", nullable: true},
        project_id: %Schema{type: :string, format: :uuid},
        author_id: %Schema{type: :string, format: :uuid},
        inserted_at: %Schema{type: :string, format: "date-time"},
        updated_at: %Schema{type: :string, format: "date-time"}
      },
      required: [:id, :content, :project_id, :author_id],
      example: %{
        "id" => "f1b2c3d4-0000-4000-8000-000000000000",
        "content" => "Planté les premiers arbustes aujourd'hui.",
        "edited_at" => nil,
        "project_id" => "c1b2c3d4-0000-4000-8000-000000000000",
        "author_id" => "a1b2c3d4-0000-4000-8000-000000000000",
        "inserted_at" => "2026-01-15T10:00:00Z",
        "updated_at" => "2026-01-15T10:00:00Z"
      }
    },
    struct?: false
  )
end
