defmodule Repousse.Repo.Migrations.ProjectTreesAndHedgeDetails do
  use Ecto.Migration

  def change do
    alter table(:planting_projects) do
      add :desired_tree_count, :integer
    end

    alter table(:hedges) do
      add :reinforced_length_m, :float
      add :tree_count, :integer
      add :commune, :string
    end
  end
end
