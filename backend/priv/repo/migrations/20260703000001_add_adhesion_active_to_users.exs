defmodule Repousse.Repo.Migrations.AddAdhesionActiveToUsers do
  use Ecto.Migration

  def change do
    alter table(:users) do
      add :adhesion_active, :boolean, null: false, default: false
    end

    create index(:users, [:adhesion_active])
  end
end
