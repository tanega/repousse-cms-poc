defmodule Repousse.Repo.Migrations.HostAnswersAndProjectDetails do
  use Ecto.Migration

  def change do
    alter table(:user_profiles) do
      add :hosting_answers, :map, default: %{}
    end

    alter table(:planting_projects) do
      add :planter_level, :string
      add :mulch, :string
      add :place_kind, :string
    end

    alter table(:tree_reports) do
      add :reason, :string
    end
  end
end
