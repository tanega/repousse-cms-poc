defmodule Repousse.Repo.Migrations.AddHostingPhoneToUserProfiles do
  use Ecto.Migration

  def change do
    alter table(:user_profiles) do
      # Famille d'accueil contact number (epic-03 US-PROFIL-14), stored E.164.
      add :hosting_phone, :string
    end
  end
end
