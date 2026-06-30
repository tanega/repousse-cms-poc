defmodule Repousse.Repo.Migrations.CreateProjectMembers do
  use Ecto.Migration

  def change do
    create table(:project_members, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :role, :string, null: false, default: "reader"
      add :joined_at, :utc_datetime
      add :project_id, references(:planting_projects, type: :binary_id, on_delete: :delete_all), null: false
      add :user_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false

      timestamps(type: :utc_datetime)
    end

    create unique_index(:project_members, [:project_id, :user_id])
    create index(:project_members, [:user_id])
  end
end
