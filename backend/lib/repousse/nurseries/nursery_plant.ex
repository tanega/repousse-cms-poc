defmodule Repousse.Nurseries.NurseryPlant do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  @derive {Jason.Encoder,
           only: [:id, :nursery_id, :taxon_id, :taxon_request_id, :taxon_request, :quantity, :note, :inserted_at, :updated_at]}

  schema "nursery_plants" do
    field :quantity, :integer, default: 0
    field :note, :string

    belongs_to :nursery, Repousse.Nurseries.Nursery
    belongs_to :taxon, Repousse.Taxa.Taxon
    # Set while the plant awaits an admin's decision on its taxon request.
    belongs_to :taxon_request, Repousse.Taxa.TaxonRequest

    timestamps(type: :utc_datetime)
  end

  def changeset(plant, attrs) do
    plant
    |> cast(attrs, [:nursery_id, :taxon_id, :taxon_request_id, :quantity, :note])
    |> validate_taxon_or_request()
    |> validate_number(:quantity, greater_than_or_equal_to: 0)
    |> foreign_key_constraint(:taxon_id)
    |> foreign_key_constraint(:taxon_request_id)
    |> unique_constraint([:nursery_id, :taxon_id])
    |> unique_constraint([:nursery_id, :taxon_request_id])
  end

  defp validate_taxon_or_request(changeset) do
    if is_nil(get_field(changeset, :taxon_id)) and is_nil(get_field(changeset, :taxon_request_id)),
      do: add_error(changeset, :taxon_id, "can't be blank"),
      else: changeset
  end
end
