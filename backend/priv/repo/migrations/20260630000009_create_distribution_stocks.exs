defmodule Repousse.Repo.Migrations.CreateDistributionStocks do
  use Ecto.Migration

  def change do
    create table(:distribution_stocks, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :quantity, :integer
      add :quantity_unknown, :boolean, default: false, null: false
      add :reserved_quantity, :integer, default: 0, null: false
      add :event_id, references(:distribution_events, type: :binary_id, on_delete: :delete_all), null: false
      add :taxon_id, references(:taxa, type: :binary_id, on_delete: :restrict), null: false

      timestamps(type: :utc_datetime)
    end

    create unique_index(:distribution_stocks, [:event_id, :taxon_id])
    create index(:distribution_stocks, [:event_id])
  end
end
