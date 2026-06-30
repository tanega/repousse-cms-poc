defmodule Repousse.Projects.PreferredSpecies do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "project_preferred_species" do
    belongs_to :project, Repousse.Projects.Project
    belongs_to :taxon, Repousse.Taxa.Taxon

    timestamps(type: :utc_datetime)
  end

  def changeset(ps, attrs) do
    ps
    |> cast(attrs, [:project_id, :taxon_id])
    |> validate_required([:project_id, :taxon_id])
    |> unique_constraint([:project_id, :taxon_id])
  end
end
