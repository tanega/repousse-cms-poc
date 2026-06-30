defmodule Repousse.Repo.Migrations.CreatePlantingProjects do
  use Ecto.Migration

  def change do
    create table(:planting_projects, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :name, :string, null: false
      add :description, :text
      add :management_type, :string, null: false, default: "individual"
      add :address, :string
      add :lat, :float
      add :lng, :float
      add :surface_m2, :float
      add :soil_type, :string
      add :publication_status, :string, null: false, default: "private"
      add :published_at, :utc_datetime
      add :archived_at, :utc_datetime
      add :owner_id, references(:users, type: :binary_id, on_delete: :nilify_all)

      timestamps(type: :utc_datetime)
    end

    create index(:planting_projects, [:owner_id])
    create index(:planting_projects, [:publication_status])
    create index(:planting_projects, [:archived_at])
  end
end
