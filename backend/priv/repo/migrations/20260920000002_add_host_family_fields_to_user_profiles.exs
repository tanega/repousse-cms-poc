defmodule Repousse.Repo.Migrations.AddHostFamilyFieldsToUserProfiles do
  use Ecto.Migration

  def change do
    alter table(:user_profiles) do
      add :hosting_surface_m2, :float
      add :hosting_equipment, {:array, :string}, null: false, default: []
    end
  end
end
