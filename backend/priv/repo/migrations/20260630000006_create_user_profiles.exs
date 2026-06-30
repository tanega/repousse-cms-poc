defmodule Repousse.Repo.Migrations.CreateUserProfiles do
  use Ecto.Migration

  def change do
    create table(:user_profiles, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :profile_type, :string, null: false
      add :engagement_note, :text
      add :address, :string
      add :avatar_url, :string
      add :notification_prefs, :map, default: %{}
      add :hosting_capacity, :integer
      add :hosting_address, :string
      add :hosting_lat, :float
      add :hosting_lng, :float
      add :hosting_availability, :text
      add :user_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false

      timestamps(type: :utc_datetime)
    end

    create index(:user_profiles, [:user_id])
    create unique_index(:user_profiles, [:user_id, :profile_type])
  end
end
