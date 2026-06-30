defmodule Repousse.Repo.Migrations.CreateJournalEntries do
  use Ecto.Migration

  def change do
    create table(:journal_entries, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :content, :text, null: false
      add :edited_at, :utc_datetime
      add :project_id, references(:planting_projects, type: :binary_id, on_delete: :delete_all), null: false
      add :author_id, references(:users, type: :binary_id, on_delete: :nilify_all)

      timestamps(type: :utc_datetime)
    end

    create index(:journal_entries, [:project_id])
    create index(:journal_entries, [:inserted_at])
  end
end
