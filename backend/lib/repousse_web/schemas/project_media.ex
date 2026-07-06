defmodule RepousseWeb.Schemas.ProjectMedia do
  @moduledoc false
  require OpenApiSpex
  alias OpenApiSpex.Schema

  OpenApiSpex.schema(
    %{
      title: "ProjectMedia",
      type: :object,
      properties: %{
        id: %Schema{type: :string, format: :uuid},
        file_type: %Schema{type: :string},
        mime_type: %Schema{
          type: :string,
          enum: ["image/jpeg", "image/png", "video/mp4", "video/webm", "application/pdf"]
        },
        url: %Schema{type: :string, format: :uri},
        filename: %Schema{type: :string},
        title: %Schema{type: :string, nullable: true},
        caption: %Schema{type: :string, nullable: true},
        size_bytes: %Schema{type: :integer, nullable: true},
        project_id: %Schema{type: :string, format: :uuid},
        uploaded_by_id: %Schema{type: :string, format: :uuid},
        inserted_at: %Schema{type: :string, format: "date-time"},
        updated_at: %Schema{type: :string, format: "date-time"}
      },
      required: [:id, :file_type, :mime_type, :url, :filename, :project_id, :uploaded_by_id],
      example: %{
        "id" => "01b2c3d4-0000-4000-8000-000000000000",
        "file_type" => "photo",
        "mime_type" => "image/jpeg",
        "url" => "https://example.com/photo.jpg",
        "filename" => "photo.jpg",
        "title" => nil,
        "caption" => nil,
        "size_bytes" => 245_760,
        "project_id" => "c1b2c3d4-0000-4000-8000-000000000000",
        "uploaded_by_id" => "a1b2c3d4-0000-4000-8000-000000000000",
        "inserted_at" => "2026-01-15T10:00:00Z",
        "updated_at" => "2026-01-15T10:00:00Z"
      }
    },
    struct?: false
  )
end
