defmodule Repousse.Repo.Migrations.AddProfileVisibilityToUsers do
  use Ecto.Migration

  # Defaults to "private": a member is only listed to other members after an
  # explicit opt-in (epic-03 RGPD stance).
  def change do
    alter table(:users) do
      add :profile_visibility, :string, null: false, default: "private"
    end
  end
end
