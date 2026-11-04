defmodule Repousse.CleDesChamps.Deposit do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  @derive {Jason.Encoder,
           only: [
             :id,
             :quantity,
             :deposited_at,
             :allocated_at,
             :user_id,
             :nursery_id,
             :taxon_id,
             :event_id,
             :inserted_at,
             :updated_at
           ]}

  schema "cle_des_champs_deposits" do
    field :quantity, :integer
    field :deposited_at, :utc_datetime
    field :allocated_at, :utc_datetime

    belongs_to :user, Repousse.Accounts.User
    belongs_to :nursery, Repousse.Nurseries.Nursery
    belongs_to :taxon, Repousse.Taxa.Taxon
    belongs_to :event, Repousse.Distributions.Event

    timestamps(type: :utc_datetime)
  end

  def changeset(deposit, attrs) do
    deposit
    |> cast(attrs, [:quantity, :user_id, :nursery_id, :taxon_id, :event_id])
    |> validate_required([:quantity, :taxon_id])
    |> validate_number(:quantity, greater_than: 0)
    |> put_change(:deposited_at, DateTime.utc_now() |> DateTime.truncate(:second))
    |> foreign_key_constraint(:taxon_id)
  end
end
