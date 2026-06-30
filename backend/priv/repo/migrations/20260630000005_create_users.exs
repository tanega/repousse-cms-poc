defmodule Repousse.Repo.Migrations.CreateUsers do
  use Ecto.Migration

  def change do
    create table(:users, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :email, :string, null: false
      add :first_name, :string
      add :last_name, :string
      add :hanko_id, :string
      add :membership_year, :integer
      add :status, :string, null: false, default: "active"
      add :activation_sent_count, :integer, default: 0, null: false
      add :last_seen_at, :utc_datetime

      timestamps(type: :utc_datetime)
    end

    create unique_index(:users, [:email])
    create unique_index(:users, [:hanko_id])
    create index(:users, [:status])
    create index(:users, [:membership_year])
  end
end
