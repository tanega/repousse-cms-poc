defmodule Repousse.Taxa.TaxonVersion do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  @derive {Jason.Encoder,
           only: [:id, :changes, :snapshot, :taxon_id, :changed_by_id, :inserted_at, :updated_at]}

  schema "taxon_versions" do
    field :changes, :map
    field :snapshot, :map

    belongs_to :taxon, Repousse.Taxa.Taxon
    belongs_to :changed_by, Repousse.Accounts.User

    timestamps(type: :utc_datetime)
  end

  def changeset(version, attrs) do
    version
    |> cast(attrs, [:changes, :snapshot, :taxon_id, :changed_by_id])
    |> validate_required([:changes, :snapshot, :taxon_id, :changed_by_id])
  end
end
