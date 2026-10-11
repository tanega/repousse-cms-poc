defmodule Repousse.Repo.Migrations.AddApprovalToUserProfiles do
  use Ecto.Migration

  def change do
    alter table(:user_profiles) do
      # Existing rows predate the approval flow: they stay `active`.
      add :status, :string, null: false, default: "active"
      add :requested_at, :utc_datetime
      add :decided_at, :utc_datetime
      add :decided_by_id, references(:users, type: :binary_id, on_delete: :nilify_all)
      add :rejection_reason, :text
    end

    create index(:user_profiles, [:status])
  end
end
