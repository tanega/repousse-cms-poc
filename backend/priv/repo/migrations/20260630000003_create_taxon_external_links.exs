defmodule Repousse.Repo.Migrations.CreateTaxonExternalLinks do
  use Ecto.Migration

  def change do
    create table(:taxon_external_links, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :source_name, :string, null: false
      add :url, :string, null: false
      add :taxon_id, references(:taxa, type: :binary_id, on_delete: :delete_all), null: false

      timestamps(type: :utc_datetime)
    end

    create index(:taxon_external_links, [:taxon_id])
  end
end
