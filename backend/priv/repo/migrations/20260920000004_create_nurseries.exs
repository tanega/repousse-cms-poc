defmodule Repousse.Repo.Migrations.CreateNurseries do
  use Ecto.Migration

  def change do
    create table(:nurseries, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :user_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      add :name, :string, null: false
      add :notes, :text
      add :address, :string
      add :lat, :float
      add :lng, :float
      add :archived_at, :utc_datetime

      timestamps(type: :utc_datetime)
    end

    create index(:nurseries, [:user_id])

    create table(:nursery_plants, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :nursery_id, references(:nurseries, type: :binary_id, on_delete: :delete_all), null: false

      # :restrict — deleting a taxon a member declared stock for must fail
      # loudly rather than silently wipe that stock line.
      add :taxon_id, references(:taxa, type: :binary_id, on_delete: :restrict), null: false
      add :quantity, :integer, null: false, default: 0
      add :note, :text

      timestamps(type: :utc_datetime)
    end

    create unique_index(:nursery_plants, [:nursery_id, :taxon_id])
  end
end
