defmodule Repousse.Accounts.Policy do
  @moduledoc """
  Bodyguard authorization for user/role management (epic-02 US-AUTH-10/11).
  """
  @behaviour Bodyguard.Policy

  alias Repousse.Accounts

  # Admin creating a user with an elevated role requires superadmin
  # (epic-02 US-AUTH-10: "Un Admin ne peut pas créer un compte superadmin ni admin").
  def authorize(:create_user, user, %{role: role}) when role in [:admin, :superadmin] do
    allow(Accounts.superadmin?(user))
  end

  def authorize(:create_user, user, _params), do: allow(Accounts.admin?(user))
  def authorize(:manage_users, user, _params), do: allow(Accounts.admin?(user))
  def authorize(:suspend_user, user, _params), do: allow(Accounts.admin?(user))

  # Only a superadmin grants/revokes admin or superadmin (epic-02 US-AUTH-11).
  def authorize(:assign_role, user, _params), do: allow(Accounts.superadmin?(user))

  def authorize(_action, _user, _params), do: {:error, :unauthorized}

  defp allow(true), do: :ok
  defp allow(false), do: {:error, :unauthorized}
end
