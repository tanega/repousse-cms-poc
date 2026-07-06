defmodule Repousse.Projects.ProjectMember do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  @derive {Jason.Encoder,
           only: [:id, :role, :joined_at, :project_id, :user_id, :user, :inserted_at, :updated_at]}

  @roles [:admin, :editor, :reader]

  schema "project_members" do
    field :role, Ecto.Enum, values: @roles, default: :reader
    field :joined_at, :utc_datetime

    belongs_to :project, Repousse.Projects.Project
    belongs_to :user, Repousse.Accounts.User

    timestamps(type: :utc_datetime)
  end

  def changeset(member, attrs) do
    member
    |> cast(attrs, [:role, :project_id, :user_id])
    |> validate_required([:role, :project_id, :user_id])
    |> validate_inclusion(:role, @roles)
    |> put_change(:joined_at, DateTime.utc_now() |> DateTime.truncate(:second))
    |> unique_constraint([:project_id, :user_id])
  end

  def role_changeset(member, role) do
    member
    |> change(role: role)
    |> validate_inclusion(:role, @roles)
  end

  def roles, do: @roles
  def editor_roles, do: [:admin, :editor]
end
