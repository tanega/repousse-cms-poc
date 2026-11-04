defmodule Repousse.Impact.TreeReport do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  @statuses [:thriving, :struggling, :dead]

  @derive {Jason.Encoder,
           only: [:id, :status, :note, :reason, :project_id, :taxon_id, :author_id, :inserted_at, :updated_at]}

  schema "tree_reports" do
    field :status, Ecto.Enum, values: @statuses
    field :note, :string
    field :reason, :string

    belongs_to :project, Repousse.Projects.Project
    belongs_to :taxon, Repousse.Taxa.Taxon
    belongs_to :author, Repousse.Accounts.User

    timestamps(type: :utc_datetime)
  end

  def changeset(report, attrs) do
    report
    |> cast(attrs, [:status, :note, :reason, :project_id, :taxon_id, :author_id])
    |> validate_required([:status, :project_id, :author_id])
    |> validate_length(:note, max: 2000)
  end
end
