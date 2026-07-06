defmodule Repousse.Distributions.Stock do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  @derive {Jason.Encoder,
           only: [
             :id,
             :quantity,
             :quantity_unknown,
             :reserved_quantity,
             :event_id,
             :taxon_id,
             :inserted_at,
             :updated_at
           ]}

  schema "distribution_stocks" do
    field :quantity, :integer
    field :quantity_unknown, :boolean, default: false
    field :reserved_quantity, :integer, default: 0

    belongs_to :event, Repousse.Distributions.Event
    belongs_to :taxon, Repousse.Taxa.Taxon
    has_many :reservation_items, Repousse.Distributions.ReservationItem, foreign_key: :stock_id

    timestamps(type: :utc_datetime)
  end

  def changeset(stock, attrs) do
    stock
    |> cast(attrs, [:quantity, :quantity_unknown, :event_id, :taxon_id])
    |> validate_required([:event_id, :taxon_id])
    |> validate_quantity()
    |> unique_constraint([:event_id, :taxon_id])
  end

  def reserve_changeset(stock, qty) do
    new_reserved = (stock.reserved_quantity || 0) + qty
    change(stock, reserved_quantity: new_reserved)
  end

  def release_changeset(stock, qty) do
    new_reserved = max(0, (stock.reserved_quantity || 0) - qty)
    change(stock, reserved_quantity: new_reserved)
  end

  def available_quantity(%{quantity_unknown: true}), do: :unknown
  def available_quantity(%{quantity: q, reserved_quantity: r}), do: max(0, q - r)

  defp validate_quantity(changeset) do
    unknown? = get_field(changeset, :quantity_unknown)

    if unknown? do
      put_change(changeset, :quantity, nil)
    else
      validate_required(changeset, [:quantity])
      |> validate_number(:quantity, greater_than_or_equal_to: 0)
    end
  end
end
