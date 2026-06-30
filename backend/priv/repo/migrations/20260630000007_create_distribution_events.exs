defmodule Repousse.Repo.Migrations.CreateDistributionEvents do
  use Ecto.Migration

  def change do
    create table(:distribution_events, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :title, :string, null: false
      add :description, :text
      add :general_contact, :string
      add :image_url, :string
      add :slug, :string, null: false
      add :status, :string, null: false, default: "draft"
      add :published_at, :utc_datetime

      timestamps(type: :utc_datetime)
    end

    create unique_index(:distribution_events, [:slug])
    create index(:distribution_events, [:status])
    create index(:distribution_events, [:published_at])
  end
end
