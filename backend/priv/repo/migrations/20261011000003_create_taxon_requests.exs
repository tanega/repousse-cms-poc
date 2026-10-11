defmodule Repousse.Repo.Migrations.CreateTaxonRequests do
  use Ecto.Migration

  def change do
    create table(:taxon_requests, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :requested_by_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      add :common_name, :string
      add :scientific_name, :string
      add :category_id, references(:taxon_categories, type: :binary_id, on_delete: :nilify_all)
      add :comment, :text
      add :status, :string, null: false, default: "pending"
      # Set once approved: the taxon that now exists for this request.
      add :taxon_id, references(:taxa, type: :binary_id, on_delete: :nilify_all)
      add :decided_by_id, references(:users, type: :binary_id, on_delete: :nilify_all)
      add :decided_at, :utc_datetime
      add :rejection_reason, :text

      timestamps(type: :utc_datetime)
    end

    create index(:taxon_requests, [:status])
    create index(:taxon_requests, [:requested_by_id])

    create constraint(:taxon_requests, :names_present,
             check: "common_name IS NOT NULL OR scientific_name IS NOT NULL"
           )

    # A nursery line can wait on a taxon request: `taxon_id` stays empty until
    # an admin approves it, then the line is attached to the new taxon.
    alter table(:nursery_plants) do
      modify :taxon_id, :binary_id, null: true, from: {:binary_id, null: false}
      add :taxon_request_id, references(:taxon_requests, type: :binary_id, on_delete: :delete_all)
    end

    create constraint(:nursery_plants, :taxon_or_request,
             check: "taxon_id IS NOT NULL OR taxon_request_id IS NOT NULL"
           )

    create unique_index(:nursery_plants, [:nursery_id, :taxon_request_id])
    create index(:nursery_plants, [:taxon_request_id])
  end
end
