defmodule Repousse.Distributions.Policy do
  @moduledoc """
  Bodyguard authorization for distribution events (epic-01). Only platform
  admins (the "Coordinateur" role) manage events; any adherent whose
  membership is active may reserve or join a waitlist — a suspended account
  is read-only (epic-02 US-AUTH-04).
  """
  @behaviour Bodyguard.Policy

  alias Repousse.Accounts

  def authorize(:manage_event, user, _params), do: allow(Accounts.admin?(user))
  def authorize(:validate_reservation, user, _params), do: allow(Accounts.admin?(user))

  def authorize(action, user, _params) when action in [:reserve, :join_waitlist] do
    allow(user.status == :active and user.adhesion_active)
  end

  def authorize(_action, _user, _params), do: {:error, :unauthorized}

  defp allow(true), do: :ok
  defp allow(false), do: {:error, :unauthorized}
end
