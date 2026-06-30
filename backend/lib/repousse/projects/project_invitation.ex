defmodule Repousse.Projects.ProjectInvitation do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "project_invitations" do
    field :email, :string
    field :role, Ecto.Enum, values: [:editor, :reader], default: :reader
    field :token, :string
    field :accepted_at, :utc_datetime
    field :expires_at, :utc_datetime

    belongs_to :project, Repousse.Projects.Project
    belongs_to :invited_by, Repousse.Accounts.User

    timestamps(type: :utc_datetime)
  end

  def changeset(invitation, attrs) do
    invitation
    |> cast(attrs, [:email, :role, :project_id, :invited_by_id])
    |> validate_required([:email, :role, :project_id, :invited_by_id])
    |> validate_format(:email, ~r/^[^\s]+@[^\s]+\.[^\s]+$/)
    |> put_token()
    |> put_expiry()
  end

  def accept_changeset(invitation) do
    change(invitation, accepted_at: DateTime.utc_now() |> DateTime.truncate(:second))
  end

  def expired?(%{expires_at: expires_at}) do
    DateTime.compare(DateTime.utc_now(), expires_at) == :gt
  end

  defp put_token(changeset) do
    put_change(changeset, :token, Base.url_encode64(:crypto.strong_rand_bytes(32), padding: false))
  end

  defp put_expiry(changeset) do
    expires_at = DateTime.utc_now() |> DateTime.add(7, :day) |> DateTime.truncate(:second)
    put_change(changeset, :expires_at, expires_at)
  end
end
