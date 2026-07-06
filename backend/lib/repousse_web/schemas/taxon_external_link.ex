defmodule RepousseWeb.Schemas.TaxonExternalLink do
  @moduledoc false
  require OpenApiSpex
  alias OpenApiSpex.Schema

  OpenApiSpex.schema(
    %{
      title: "TaxonExternalLink",
      type: :object,
      properties: %{
        id: %Schema{type: :string, format: :uuid},
        source_name: %Schema{
          type: :string,
          enum: ["Floriscope", "Wikipedia", "Wikidata", "Encyclopedia of Life", "DoPI", "GloBI", "Other"]
        },
        url: %Schema{type: :string, format: :uri},
        taxon_id: %Schema{type: :string, format: :uuid},
        inserted_at: %Schema{type: :string, format: "date-time"},
        updated_at: %Schema{type: :string, format: "date-time"}
      },
      required: [:id, :source_name, :url, :taxon_id],
      example: %{
        "id" => "a1b2c3d4-0002-4000-8000-000000000000",
        "source_name" => "Wikipedia",
        "url" => "https://fr.wikipedia.org/wiki/Prunus_avium",
        "taxon_id" => "21b2c3d4-0000-4000-8000-000000000000",
        "inserted_at" => "2026-01-15T10:00:00Z",
        "updated_at" => "2026-01-15T10:00:00Z"
      }
    },
    struct?: false
  )
end
