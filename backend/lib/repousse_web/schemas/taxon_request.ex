defmodule RepousseWeb.Schemas.TaxonRequest do
  @moduledoc false
  require OpenApiSpex
  alias OpenApiSpex.Schema

  OpenApiSpex.schema(
    %{
      title: "TaxonRequest",
      description: "A member's request to add a plant missing from the reference list.",
      type: :object,
      properties: %{
        id: %Schema{type: :string, format: :uuid},
        common_name: %Schema{type: :string, nullable: true},
        scientific_name: %Schema{type: :string, nullable: true},
        category_id: %Schema{type: :string, format: :uuid, nullable: true},
        comment: %Schema{type: :string, nullable: true},
        status: %Schema{type: :string, enum: ["pending", "approved", "rejected"]},
        taxon_id: %Schema{type: :string, format: :uuid, nullable: true},
        requested_by_id: %Schema{type: :string, format: :uuid},
        decided_at: %Schema{type: :string, format: "date-time", nullable: true},
        rejection_reason: %Schema{type: :string, nullable: true},
        inserted_at: %Schema{type: :string, format: "date-time"}
      },
      required: [:id, :status]
    },
    struct?: false
  )
end
