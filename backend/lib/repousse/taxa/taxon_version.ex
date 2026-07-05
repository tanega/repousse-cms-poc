defmodule Repousse.Taxa.TaxonVersion do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  # Scalar-only, excluding `:taxon`/`:changed_by` — besides `:taxon` not
  # always being preloaded, `Repousse.Accounts.User`'s own `@derive` lists
  # `:profiles`, which isn't preloaded by `Taxa.list_versions/1`'s `:changed_by`
  # preload either, so embedding the full user here would just move the same
  # `NotLoaded` crash one level down. `:changed_by_id` is enough for callers
  # to attribute the change; expose the author's name via a dedicated
  # endpoint/preload later if needed.
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
