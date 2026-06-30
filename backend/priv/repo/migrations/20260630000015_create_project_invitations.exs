defmodule Repousse.Repo.Migrations.CreateProjectInvitations do
  use Ecto.Migration

  def change do
    create table(:project_invitations, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :email, :string, null: false
      add :role, :string, null: false, default: "reader"
      add :token, :string, null: false
      add :accepted_at, :utc_datetime
      add :expires_at, :utc_datetime, null: false
      add :project_id, references(:planting_projects, type: :binary_id, on_delete: :delete_all), null: false
      add :invited_by_id, references(:users, type: :binary_id, on_delete: :nilify_all)

      timestamps(type: :utc_datetime)
    end

    create unique_index(:project_invitations, [:token])
    create index(:project_invitations, [:project_id])
    create index(:project_invitations, [:email])
  end
end
