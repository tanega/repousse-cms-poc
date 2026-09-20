defmodule RepousseWeb.Schemas.HostedSpecies do
  @moduledoc false
  require OpenApiSpex
  alias OpenApiSpex.Schema

  OpenApiSpex.schema(
    %{
      title: "HostedSpecies",
      type: :object,
      properties: %{
        id: %Schema{type: :string, format: :uuid},
        user_profile_id: %Schema{type: :string, format: :uuid},
        taxon_id: %Schema{type: :string, format: :uuid},
        inserted_at: %Schema{type: :string, format: "date-time"},
        updated_at: %Schema{type: :string, format: "date-time"}
      },
      required: [:id, :taxon_id],
      example: %{
        "id" => "f1f2f3f4-0000-4000-8000-000000000000",
        "user_profile_id" => "b1b2c3d4-0000-4000-8000-000000000000",
        "taxon_id" => "c1c2c3c4-0000-4000-8000-000000000000",
        "inserted_at" => "2026-01-15T10:00:00Z",
        "updated_at" => "2026-01-15T10:00:00Z"
      }
    },
    struct?: false
  )
end
