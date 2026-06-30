defmodule Repousse.Repo.Migrations.CreateTaxonVersions do
  use Ecto.Migration

  def change do
    create table(:taxon_versions, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :changes, :map, null: false
      add :snapshot, :map, null: false
      add :taxon_id, references(:taxa, type: :binary_id, on_delete: :delete_all), null: false
      add :changed_by_id, :binary_id

      timestamps(type: :utc_datetime)
    end

    create index(:taxon_versions, [:taxon_id])
    create index(:taxon_versions, [:inserted_at])
  end
end
