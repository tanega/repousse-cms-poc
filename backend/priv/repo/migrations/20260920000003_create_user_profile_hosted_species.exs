defmodule Repousse.Repo.Migrations.CreateUserProfileHostedSpecies do
  use Ecto.Migration

  def change do
    create table(:user_profile_hosted_species, primary_key: false) do
      add :id, :binary_id, primary_key: true

      add :user_profile_id, references(:user_profiles, type: :binary_id, on_delete: :delete_all),
        null: false

      add :taxon_id, references(:taxa, type: :binary_id, on_delete: :restrict), null: false

      timestamps(type: :utc_datetime)
    end

    create unique_index(:user_profile_hosted_species, [:user_profile_id, :taxon_id])
  end
end
