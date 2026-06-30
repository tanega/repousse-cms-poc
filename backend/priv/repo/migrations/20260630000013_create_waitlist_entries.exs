defmodule Repousse.Repo.Migrations.CreateWaitlistEntries do
  use Ecto.Migration

  def change do
    create table(:waitlist_entries, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :position, :integer
      add :status, :string, null: false, default: "waiting"
      add :notified_at, :utc_datetime
      add :notification_expires_at, :utc_datetime
      add :user_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      add :event_id, references(:distribution_events, type: :binary_id, on_delete: :delete_all), null: false
      add :taxon_id, references(:taxa, type: :binary_id, on_delete: :restrict), null: false

      timestamps(type: :utc_datetime)
    end

    create unique_index(:waitlist_entries, [:user_id, :event_id, :taxon_id])
    create index(:waitlist_entries, [:event_id, :taxon_id, :position])
  end
end
