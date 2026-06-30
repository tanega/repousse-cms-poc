defmodule Repousse.Repo.Migrations.CreateReservationItems do
  use Ecto.Migration

  def change do
    create table(:reservation_items, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :reserved_qty, :integer, null: false
      add :distributed_qty, :integer
      add :reservation_id, references(:reservations, type: :binary_id, on_delete: :delete_all), null: false
      add :stock_id, references(:distribution_stocks, type: :binary_id, on_delete: :restrict), null: false
      add :taxon_id, references(:taxa, type: :binary_id, on_delete: :restrict), null: false

      timestamps(type: :utc_datetime)
    end

    create index(:reservation_items, [:reservation_id])
    create index(:reservation_items, [:stock_id])
    create unique_index(:reservation_items, [:reservation_id, :taxon_id])
  end
end
