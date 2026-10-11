defmodule RepousseWeb.Schemas.Notification do
  @moduledoc false
  require OpenApiSpex
  alias OpenApiSpex.Schema

  OpenApiSpex.schema(
    %{
      title: "Notification",
      type: :object,
      properties: %{
        id: %Schema{type: :string, format: :uuid},
        user_id: %Schema{type: :string, format: :uuid},
        type: %Schema{type: :string, example: "profile_request.approved"},
        title: %Schema{type: :string},
        body: %Schema{type: :string, nullable: true},
        link: %Schema{type: :string, nullable: true, description: "Webapp-relative path"},
        payload: %Schema{type: :object},
        read_at: %Schema{type: :string, format: "date-time", nullable: true},
        inserted_at: %Schema{type: :string, format: "date-time"}
      },
      required: [:id, :type, :title]
    },
    struct?: false
  )
end
