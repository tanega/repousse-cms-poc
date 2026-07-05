defmodule Repousse.Taxa.TaxonExternalLink do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  @derive {Jason.Encoder, only: [:id, :source_name, :url, :taxon_id, :inserted_at, :updated_at]}

  @known_sources [
    "Floriscope",
    "Wikipedia",
    "Wikidata",
    "Encyclopedia of Life",
    "DoPI",
    "GloBI",
    "Other"
  ]

  schema "taxon_external_links" do
    field :source_name, :string
    field :url, :string

    belongs_to :taxon, Repousse.Taxa.Taxon

    timestamps(type: :utc_datetime)
  end

  def changeset(link, attrs) do
    link
    |> cast(attrs, [:source_name, :url, :taxon_id])
    # :taxon_id is intentionally not in validate_required/2 — when this
    # changeset runs nested via `Taxon.changeset/2`'s `cast_assoc(:external_links, ...)`,
    # Ecto only knows the parent id at insert time, after this changeset is
    # built. Direct/standalone inserts (see `Taxa.add_external_link/2`) always
    # merge `taxon_id` into attrs before calling this changeset, and the
    # column keeps its DB-level `null: false` constraint as a safety net.
    |> validate_required([:source_name, :url])
    |> validate_length(:source_name, max: 100)
    |> validate_format(:url, ~r/^https?:\/\//)
  end

  def known_sources, do: @known_sources
end
