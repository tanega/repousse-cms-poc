defmodule Repousse.Repo.Migrations.CreateTaxa do
  use Ecto.Migration

  def change do
    create table(:taxa, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :scientific_name, :string
      add :common_name, :string, null: false
      add :taxonomic_level, :string
      add :is_non_taxonomic, :boolean, default: false, null: false
      add :notes, :text
      add :parent_id, references(:taxa, type: :binary_id, on_delete: :restrict)
      add :category_id, references(:taxon_categories, type: :binary_id, on_delete: :restrict)

      timestamps(type: :utc_datetime)
    end

    create unique_index(:taxa, [:scientific_name])
    create index(:taxa, [:parent_id])
    create index(:taxa, [:category_id])
    create index(:taxa, [:taxonomic_level])
  end
end
