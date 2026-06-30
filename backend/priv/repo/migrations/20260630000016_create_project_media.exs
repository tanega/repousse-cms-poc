defmodule Repousse.Repo.Migrations.CreateProjectMedia do
  use Ecto.Migration

  def change do
    create table(:project_media, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :file_type, :string, null: false
      add :mime_type, :string, null: false
      add :url, :string, null: false
      add :filename, :string, null: false
      add :title, :string
      add :caption, :text
      add :size_bytes, :integer
      add :project_id, references(:planting_projects, type: :binary_id, on_delete: :delete_all), null: false
      add :uploaded_by_id, references(:users, type: :binary_id, on_delete: :nilify_all)

      timestamps(type: :utc_datetime)
    end

    create index(:project_media, [:project_id])
  end
end
