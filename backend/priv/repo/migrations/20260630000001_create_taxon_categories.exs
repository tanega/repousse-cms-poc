defmodule Repousse.Repo.Migrations.CreateTaxonCategories do
  use Ecto.Migration

  def change do
    create table(:taxon_categories, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :name, :string, null: false
      add :slug, :string, null: false

      timestamps(type: :utc_datetime)
    end

    create unique_index(:taxon_categories, [:slug])
    create unique_index(:taxon_categories, [:name])
  end
end
