defmodule Repousse.Repo.Migrations.CreateReservations do
  use Ecto.Migration

  def change do
    create table(:reservations, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :status, :string, null: false, default: "confirmed"
      add :cancelled_at, :utc_datetime
      add :validated_at, :utc_datetime
      add :coordinator_note, :string
      add :user_id, references(:users, type: :binary_id, on_delete: :restrict), null: false
      add :slot_id, references(:distribution_slots, type: :binary_id, on_delete: :restrict), null: false
      add :event_id, references(:distribution_events, type: :binary_id, on_delete: :restrict), null: false
      add :project_id, references(:planting_projects, type: :binary_id, on_delete: :restrict), null: false

      timestamps(type: :utc_datetime)
    end

    create unique_index(:reservations, [:user_id, :event_id])
    create index(:reservations, [:event_id])
    create index(:reservations, [:slot_id])
    create index(:reservations, [:user_id])
    create index(:reservations, [:status])
  end
end
