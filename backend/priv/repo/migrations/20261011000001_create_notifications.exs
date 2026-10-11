defmodule Repousse.Repo.Migrations.CreateNotifications do
  use Ecto.Migration

  def change do
    create table(:notifications, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :user_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      add :type, :string, null: false
      add :title, :string, null: false
      add :body, :text
      add :link, :string
      add :payload, :map, null: false, default: %{}
      add :read_at, :utc_datetime

      timestamps(type: :utc_datetime)
    end

    create index(:notifications, [:user_id, :inserted_at])
    create index(:notifications, [:user_id], where: "read_at IS NULL", name: :notifications_unread_idx)
  end
end
