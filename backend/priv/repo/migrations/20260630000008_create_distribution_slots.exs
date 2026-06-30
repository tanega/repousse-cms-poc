defmodule Repousse.Repo.Migrations.CreateDistributionSlots do
  use Ecto.Migration

  def change do
    create table(:distribution_slots, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :location_name, :string, null: false
      add :address, :string
      add :date, :date, null: false
      add :start_time, :time, null: false
      add :end_time, :time, null: false
      add :contact, :string
      add :event_id, references(:distribution_events, type: :binary_id, on_delete: :delete_all), null: false

      timestamps(type: :utc_datetime)
    end

    create index(:distribution_slots, [:event_id])
    create index(:distribution_slots, [:date])
  end
end
