defmodule RepousseWeb.Schemas.ProfileRequest do
  @moduledoc false
  require OpenApiSpex
  alias OpenApiSpex.Schema

  OpenApiSpex.schema(
    %{
      title: "ProfileRequest",
      description: "An engagement profile (`user_profiles` row) with its approval status and requester.",
      type: :object,
      properties: %{
        id: %Schema{type: :string, format: :uuid},
        profile_type: %Schema{type: :string, enum: ["volunteer", "adoptant", "host_family"]},
        status: %Schema{type: :string, enum: ["pending", "active", "rejected"]},
        requested_at: %Schema{type: :string, format: "date-time", nullable: true},
        decided_at: %Schema{type: :string, format: "date-time", nullable: true},
        rejection_reason: %Schema{type: :string, nullable: true},
        user: %Schema{
          type: :object,
          properties: %{
            id: %Schema{type: :string, format: :uuid},
            first_name: %Schema{type: :string, nullable: true},
            last_name: %Schema{type: :string, nullable: true},
            email: %Schema{type: :string}
          }
        }
      },
      required: [:id, :profile_type, :status]
    },
    struct?: false
  )
end
