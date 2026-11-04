defmodule Repousse.Impact.ProjectPlanting do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  @sources [:distribution, :historical, :direct]

  @derive {Jason.Encoder,
           only: [
             :id,
             :quantity,
             :source,
             :note,
             :planted_on,
             :project_id,
             :taxon_id,
             :reservation_id,
             :recorded_by_id,
             :inserted_at,
             :updated_at
           ]}

  schema "project_plantings" do
    field :quantity, :integer
    field :source, Ecto.Enum, values: @sources
    field :note, :string
    field :planted_on, :date

    belongs_to :project, Repousse.Projects.Project
    belongs_to :taxon, Repousse.Taxa.Taxon
    belongs_to :reservation, Repousse.Distributions.Reservation
    belongs_to :recorded_by, Repousse.Accounts.User

    timestamps(type: :utc_datetime)
  end

  def changeset(planting, attrs) do
    planting
    |> cast(attrs, [:quantity, :source, :note, :planted_on, :project_id, :taxon_id, :reservation_id, :recorded_by_id])
    |> validate_required([:quantity, :source, :taxon_id])
    |> validate_number(:quantity, greater_than: 0)
    |> validate_project_for_source()
  end

  defp validate_project_for_source(changeset) do
    if get_field(changeset, :source) == :distribution and is_nil(get_field(changeset, :project_id)) do
      add_error(changeset, :project_id, "can't be blank")
    else
      changeset
    end
  end
end
