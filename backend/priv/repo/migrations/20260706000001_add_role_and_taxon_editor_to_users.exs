defmodule Repousse.Repo.Migrations.AddRoleAndTaxonEditorToUsers do
  use Ecto.Migration

  def up do
    alter table(:users) do
      add :role, :string, null: false, default: "member"
      add :taxon_editor, :boolean, null: false, default: false
    end

    create index(:users, [:role])

    # Backfill: the old "Administrateur" self-selectable profile is being
    # replaced by the platform-wide `role` field. Anyone who held that
    # profile becomes a platform admin, and the profile row is removed since
    # `user_profiles.profile_type` no longer accepts "admin".
    execute """
    UPDATE users
    SET role = 'admin'
    WHERE id IN (SELECT user_id FROM user_profiles WHERE profile_type = 'admin')
    """

    execute "DELETE FROM user_profiles WHERE profile_type = 'admin'"
  end

  def down do
    alter table(:users) do
      remove :taxon_editor
      remove :role
    end
  end
end
