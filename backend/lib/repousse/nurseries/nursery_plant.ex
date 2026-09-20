defmodule Repousse.Nurseries.NurseryPlant do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  @derive {Jason.Encoder,
           only: [:id, :nursery_id, :taxon_id, :quantity, :note, :inserted_at, :updated_at]}

  schema "nursery_plants" do
    field :quantity, :integer, default: 0
    field :note, :string

    belongs_to :nursery, Repousse.Nurseries.Nursery
    belongs_to :taxon, Repousse.Taxa.Taxon

    timestamps(type: :utc_datetime)
  end

  def changeset(plant, attrs) do
    plant
    |> cast(attrs, [:nursery_id, :taxon_id, :quantity, :note])
    |> validate_required([:taxon_id])
    |> validate_number(:quantity, greater_than_or_equal_to: 0)
    |> foreign_key_constraint(:taxon_id)
    |> unique_constraint([:nursery_id, :taxon_id])
  end
end
