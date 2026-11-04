defmodule Repousse.Impact.Hedge do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  @derive {Jason.Encoder,
           only: [:id, :name, :length_m, :survival_rate, :planted_on, :notes, :taxon_id, :inserted_at, :updated_at]}

  schema "hedges" do
    field :name, :string
    field :length_m, :float
    field :survival_rate, :integer
    field :planted_on, :date
    field :notes, :string

    belongs_to :taxon, Repousse.Taxa.Taxon

    timestamps(type: :utc_datetime)
  end

  def changeset(hedge, attrs) do
    hedge
    |> cast(attrs, [:name, :length_m, :survival_rate, :planted_on, :notes, :taxon_id])
    |> validate_required([:name])
    |> validate_length(:name, min: 2, max: 200)
    |> validate_number(:survival_rate, greater_than_or_equal_to: 0, less_than_or_equal_to: 100)
    |> validate_number(:length_m, greater_than: 0)
  end
end
