defmodule Repousse.Taxa.TaxonCategory do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  @derive {Jason.Encoder, only: [:id, :name, :slug, :inserted_at, :updated_at]}

  schema "taxon_categories" do
    field :name, :string
    field :slug, :string

    has_many :taxa, Repousse.Taxa.Taxon, foreign_key: :category_id

    timestamps(type: :utc_datetime)
  end

  def changeset(cat, attrs) do
    cat
    |> cast(attrs, [:name])
    |> validate_required([:name])
    |> validate_length(:name, min: 2, max: 100)
    |> generate_slug()
    |> unique_constraint(:slug)
  end

  defp generate_slug(changeset) do
    case get_change(changeset, :name) do
      nil -> changeset
      name ->
        slug = name |> String.downcase() |> String.replace(~r/[^a-z0-9]+/, "-") |> String.trim("-")
        put_change(changeset, :slug, slug)
    end
  end
end
