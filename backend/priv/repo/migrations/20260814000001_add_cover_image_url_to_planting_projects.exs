defmodule Repousse.Repo.Migrations.AddCoverImageUrlToPlantingProjects do
  use Ecto.Migration

  def change do
    alter table(:planting_projects) do
      add :cover_image_url, :string
    end
  end
end
