defmodule RepousseWeb.Schemas.Event do
  @moduledoc false
  require OpenApiSpex
  alias OpenApiSpex.Schema

  OpenApiSpex.schema(
    %{
      title: "Event",
      description: "A distribution event",
      type: :object,
      properties: %{
        id: %Schema{type: :string, format: :uuid},
        title: %Schema{type: :string},
        description: %Schema{type: :string, nullable: true},
        general_contact: %Schema{type: :string, nullable: true},
        image_url: %Schema{type: :string, nullable: true},
        slug: %Schema{type: :string},
        status: %Schema{type: :string, enum: ["draft", "published", "closed"]},
        published_at: %Schema{type: :string, format: "date-time", nullable: true},
        inserted_at: %Schema{type: :string, format: "date-time"},
        updated_at: %Schema{type: :string, format: "date-time"}
      },
      required: [:id, :title, :slug, :status],
      example: %{
        "id" => "31b2c3d4-0000-4000-8000-000000000000",
        "title" => "Distribution de printemps",
        "description" => nil,
        "general_contact" => nil,
        "image_url" => nil,
        "slug" => "distribution-de-printemps-a1b2c3",
        "status" => "draft",
        "published_at" => nil,
        "inserted_at" => "2026-01-15T10:00:00Z",
        "updated_at" => "2026-01-15T10:00:00Z"
      }
    },
    struct?: false
  )
end
