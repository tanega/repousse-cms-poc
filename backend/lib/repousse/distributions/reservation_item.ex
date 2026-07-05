defmodule Repousse.Distributions.ReservationItem do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  # Associations are excluded: `:taxon` belongs to another track's schema
  # that doesn't derive Jason.Encoder yet, and `Ecto.Association.NotLoaded`
  # deliberately raises when JSON-encoded regardless.
  @derive {Jason.Encoder,
           only: [
             :id,
             :reserved_qty,
             :distributed_qty,
             :reservation_id,
             :stock_id,
             :taxon_id,
             :inserted_at,
             :updated_at
           ]}

  schema "reservation_items" do
    field :reserved_qty, :integer
    field :distributed_qty, :integer

    belongs_to :reservation, Repousse.Distributions.Reservation
    belongs_to :stock, Repousse.Distributions.Stock
    belongs_to :taxon, Repousse.Taxa.Taxon

    timestamps(type: :utc_datetime)
  end

  def changeset(item, attrs) do
    item
    |> cast(attrs, [:reserved_qty, :reservation_id, :stock_id, :taxon_id])
    |> validate_required([:reserved_qty, :reservation_id, :stock_id, :taxon_id])
    |> validate_number(:reserved_qty, greater_than: 0)
  end

  def validate_changeset(item, distributed_qty) do
    item
    |> change(distributed_qty: distributed_qty)
    |> validate_number(:distributed_qty, greater_than_or_equal_to: 0)
  end
end
