defmodule Repousse.Nurseries.Nursery do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  @derive {Jason.Encoder,
           only: [
             :id,
             :name,
             :notes,
             :address,
             :lat,
             :lng,
             :archived_at,
             :user_id,
             :plants,
             :inserted_at,
             :updated_at
           ]}

  schema "nurseries" do
    field :name, :string
    field :notes, :string
    field :address, :string
    field :lat, :float
    field :lng, :float
    field :archived_at, :utc_datetime

    belongs_to :user, Repousse.Accounts.User
    has_many :plants, Repousse.Nurseries.NurseryPlant, on_replace: :delete

    timestamps(type: :utc_datetime)
  end

  # `plants` is a full replace on every write — the client always sends the
  # whole list, mirroring `Projects.Project`'s `preferred_species`.
  def changeset(nursery, attrs) do
    nursery
    |> cast(attrs, [:name, :notes, :address, :lat, :lng, :user_id])
    |> validate_required([:name, :user_id])
    |> validate_length(:name, min: 2, max: 200)
    |> cast_assoc(:plants)
  end

  def archive_changeset(nursery) do
    change(nursery, archived_at: DateTime.utc_now() |> DateTime.truncate(:second))
  end
end
