defmodule Repousse.Taxa.TaxonRequest do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  @statuses [:pending, :approved, :rejected]

  @derive {Jason.Encoder,
           only: [
             :id,
             :common_name,
             :scientific_name,
             :category_id,
             :comment,
             :status,
             :taxon_id,
             :decided_at,
             :rejection_reason,
             :requested_by_id,
             :inserted_at
           ]}

  schema "taxon_requests" do
    field :common_name, :string
    field :scientific_name, :string
    field :comment, :string
    field :status, Ecto.Enum, values: @statuses, default: :pending
    field :decided_at, :utc_datetime
    field :rejection_reason, :string

    belongs_to :requested_by, Repousse.Accounts.User
    belongs_to :category, Repousse.Taxa.TaxonCategory
    belongs_to :taxon, Repousse.Taxa.Taxon
    belongs_to :decided_by, Repousse.Accounts.User
    has_many :nursery_plants, Repousse.Nurseries.NurseryPlant

    timestamps(type: :utc_datetime)
  end

  def create_changeset(request, attrs) do
    request
    |> cast(attrs, [:common_name, :scientific_name, :category_id, :comment, :requested_by_id])
    |> update_change(:common_name, &blank_to_nil/1)
    |> update_change(:scientific_name, &blank_to_nil/1)
    |> update_change(:comment, &blank_to_nil/1)
    |> validate_required([:requested_by_id])
    |> validate_names_present()
    |> validate_length(:common_name, max: 200)
    |> validate_length(:scientific_name, max: 200)
    |> validate_length(:comment, max: 2000)
    |> foreign_key_constraint(:category_id)
    |> check_constraint(:common_name, name: :names_present)
  end

  def decision_changeset(request, status, decider_id, opts \\ []) when status in [:approved, :rejected] do
    change(request,
      status: status,
      decided_by_id: decider_id,
      decided_at: DateTime.utc_now() |> DateTime.truncate(:second),
      taxon_id: opts[:taxon_id],
      rejection_reason: if(status == :rejected, do: opts[:reason])
    )
  end

  defp validate_names_present(changeset) do
    if is_nil(get_field(changeset, :common_name)) and is_nil(get_field(changeset, :scientific_name)) do
      add_error(changeset, :common_name, "indiquez au moins un nom commun ou un nom scientifique")
    else
      changeset
    end
  end

  defp blank_to_nil(value) when is_binary(value) do
    case String.trim(value) do
      "" -> nil
      trimmed -> trimmed
    end
  end

  defp blank_to_nil(value), do: value
end
