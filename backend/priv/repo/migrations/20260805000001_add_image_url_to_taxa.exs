defmodule Repousse.Repo.Migrations.AddImageUrlToTaxa do
  use Ecto.Migration

  def change do
    alter table(:taxa) do
      add :image_url, :string
    end
  end
end
