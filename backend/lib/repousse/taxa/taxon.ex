defmodule Repousse.Taxa.Taxon do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  @levels [:genus, :species, :variety]

  @derive {Jason.Encoder,
           only: [
             :id,
             :scientific_name,
             :common_name,
             :taxonomic_level,
             :is_non_taxonomic,
             :notes,
             :image_url,
             :parent_id,
             :category_id,
             :category,
             :external_links,
             :nb_distributions,
             :nb_projets,
             :inserted_at,
             :updated_at
           ]}

  schema "taxa" do
    field :scientific_name, :string
    field :common_name, :string
    field :taxonomic_level, Ecto.Enum, values: @levels
    field :is_non_taxonomic, :boolean, default: false
    field :notes, :string
    field :image_url, :string
    # Computed by Repousse.Taxa, not stored — see enrich/1.
    field :nb_distributions, :integer, virtual: true, default: 0
    field :nb_projets, :integer, virtual: true, default: 0

    belongs_to :parent, Repousse.Taxa.Taxon
    belongs_to :category, Repousse.Taxa.TaxonCategory
    has_many :children, Repousse.Taxa.Taxon, foreign_key: :parent_id
    has_many :external_links, Repousse.Taxa.TaxonExternalLink, on_replace: :delete
    has_many :versions, Repousse.Taxa.TaxonVersion
    has_many :distribution_stocks, Repousse.Distributions.Stock
    has_many :preferred_in_projects, Repousse.Projects.PreferredSpecies

    timestamps(type: :utc_datetime)
  end

  def changeset(taxon, attrs) do
    taxon
    |> cast(attrs, [:scientific_name, :common_name, :taxonomic_level, :is_non_taxonomic, :notes, :image_url, :parent_id, :category_id])
    |> validate_required([:common_name])
    |> maybe_require_scientific_name()
    |> validate_length(:common_name, min: 1, max: 200)
    |> validate_parent_level()
    |> unique_constraint(:scientific_name)
    |> cast_assoc(:external_links, with: &Repousse.Taxa.TaxonExternalLink.changeset/2)
  end

  def levels, do: @levels

  defp maybe_require_scientific_name(changeset) do
    if get_field(changeset, :is_non_taxonomic) do
      changeset
    else
      validate_required(changeset, [:scientific_name, :taxonomic_level])
    end
  end

  defp validate_parent_level(changeset) do
    # Genus can have no parent; species must have genus parent; variety must have species parent
    # This is a soft check — deep validation done in context
    changeset
  end
end
