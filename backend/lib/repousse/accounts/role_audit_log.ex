defmodule Repousse.Accounts.RoleAuditLog do
  @moduledoc """
  Append-only audit trail for platform role grants/revocations (epic-02
  US-AUTH-11: "Historique des attributions/révocations tracé"). Written by
  `Repousse.Accounts.assign_role/3` inside the same transaction as the role
  change itself, so the log can never drift from `users.role`.
  """
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  @roles [:member, :admin, :superadmin]

  @derive {Jason.Encoder,
           only: [:id, :user_id, :granted_by_id, :previous_role, :new_role, :inserted_at]}

  schema "role_audit_logs" do
    field :previous_role, Ecto.Enum, values: @roles
    field :new_role, Ecto.Enum, values: @roles

    belongs_to :user, Repousse.Accounts.User
    belongs_to :granted_by, Repousse.Accounts.User

    timestamps(type: :utc_datetime, updated_at: false)
  end

  def changeset(log, attrs) do
    log
    |> cast(attrs, [:user_id, :granted_by_id, :previous_role, :new_role])
    |> validate_required([:user_id, :new_role])
    |> validate_inclusion(:new_role, @roles)
  end
end
