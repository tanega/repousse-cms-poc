defmodule Repousse.Repo.Migrations.CreateRoleAuditLogs do
  use Ecto.Migration

  def change do
    create table(:role_audit_logs, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :user_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      add :granted_by_id, references(:users, type: :binary_id, on_delete: :nilify_all)
      add :previous_role, :string
      add :new_role, :string, null: false

      timestamps(type: :utc_datetime, updated_at: false)
    end

    create index(:role_audit_logs, [:user_id])
    create index(:role_audit_logs, [:granted_by_id])
  end
end
