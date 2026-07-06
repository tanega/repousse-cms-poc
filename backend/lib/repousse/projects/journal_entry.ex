defmodule Repousse.Projects.JournalEntry do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  @derive {Jason.Encoder,
           only: [:id, :content, :edited_at, :project_id, :author_id, :inserted_at, :updated_at]}

  schema "journal_entries" do
    field :content, :string
    field :edited_at, :utc_datetime

    belongs_to :project, Repousse.Projects.Project
    belongs_to :author, Repousse.Accounts.User

    timestamps(type: :utc_datetime)
  end

  def changeset(entry, attrs) do
    entry
    |> cast(attrs, [:content, :project_id, :author_id])
    |> validate_required([:content, :project_id, :author_id])
    |> validate_length(:content, min: 1, max: 5000)
  end

  def update_changeset(entry, attrs) do
    entry
    |> cast(attrs, [:content])
    |> validate_required([:content])
    |> validate_length(:content, min: 1, max: 5000)
    |> put_change(:edited_at, DateTime.utc_now() |> DateTime.truncate(:second))
  end
end
