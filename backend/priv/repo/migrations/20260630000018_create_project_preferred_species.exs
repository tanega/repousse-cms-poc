defmodule Repousse.Repo.Migrations.CreateProjectPreferredSpecies do
  use Ecto.Migration

  def change do
    create table(:project_preferred_species, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :project_id, references(:planting_projects, type: :binary_id, on_delete: :delete_all), null: false
      add :taxon_id, references(:taxa, type: :binary_id, on_delete: :restrict), null: false

      timestamps(type: :utc_datetime)
    end

    create unique_index(:project_preferred_species, [:project_id, :taxon_id])
  end
end
