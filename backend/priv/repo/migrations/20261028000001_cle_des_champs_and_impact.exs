defmodule Repousse.Repo.Migrations.CleDesChampsAndImpact do
  use Ecto.Migration

  def change do
    create table(:cle_des_champs_deposits, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :quantity, :integer, null: false
      add :deposited_at, :utc_datetime, null: false
      add :allocated_at, :utc_datetime

      add :user_id, references(:users, type: :binary_id, on_delete: :nilify_all)
      add :nursery_id, references(:nurseries, type: :binary_id, on_delete: :nilify_all)
      add :taxon_id, references(:taxa, type: :binary_id, on_delete: :restrict), null: false

      add :event_id, references(:distribution_events, type: :binary_id, on_delete: :nilify_all)

      timestamps(type: :utc_datetime)
    end

    create index(:cle_des_champs_deposits, [:allocated_at])
    create index(:cle_des_champs_deposits, [:user_id])
    create index(:cle_des_champs_deposits, [:taxon_id])

    create table(:project_plantings, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :quantity, :integer, null: false
      add :source, :string, null: false
      add :note, :text
      add :planted_on, :date

      add :project_id, references(:planting_projects, type: :binary_id, on_delete: :nilify_all)
      add :taxon_id, references(:taxa, type: :binary_id, on_delete: :restrict), null: false
      add :reservation_id, references(:reservations, type: :binary_id, on_delete: :nilify_all)
      add :recorded_by_id, references(:users, type: :binary_id, on_delete: :nilify_all)

      timestamps(type: :utc_datetime)
    end

    create index(:project_plantings, [:project_id])
    create index(:project_plantings, [:source])

    create table(:hedges, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :name, :string, null: false
      add :length_m, :float
      add :survival_rate, :integer
      add :planted_on, :date
      add :notes, :text
      add :taxon_id, references(:taxa, type: :binary_id, on_delete: :nilify_all)

      timestamps(type: :utc_datetime)
    end

    create table(:tree_reports, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :status, :string, null: false
      add :note, :text

      add :project_id, references(:planting_projects, type: :binary_id, on_delete: :delete_all), null: false
      add :taxon_id, references(:taxa, type: :binary_id, on_delete: :nilify_all)
      add :author_id, references(:users, type: :binary_id, on_delete: :nilify_all), null: false

      timestamps(type: :utc_datetime)
    end

    create index(:tree_reports, [:project_id])
  end
end
