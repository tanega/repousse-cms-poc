defmodule Repousse.Taxa.TaxonExternalLink do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  @known_sources ["Floriscope", "Wikipedia", "Wikidata", "Encyclopedia of Life", "DoPI", "GloBI", "Other"]

  schema "taxon_external_links" do
    field :source_name, :string
    field :url, :string

    belongs_to :taxon, Repousse.Taxa.Taxon

    timestamps(type: :utc_datetime)
  end

  def changeset(link, attrs) do
    link
    |> cast(attrs, [:source_name, :url, :taxon_id])
    |> validate_required([:source_name, :url, :taxon_id])
    |> validate_length(:source_name, max: 100)
    |> validate_format(:url, ~r/^https?:\/\//)
  end

  def known_sources, do: @known_sources
end
