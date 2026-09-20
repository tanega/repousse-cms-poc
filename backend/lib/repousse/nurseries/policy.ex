defmodule Repousse.Nurseries.Policy do
  @moduledoc """
  Bodyguard authorization for nurseries (epic-03 US-PROFIL-11).

  Read access follows the owner's `profile_visibility`: a public profile
  exposes its nurseries to every member, a private one only to the owner and
  to coordinators (`admin`/`superadmin`). Write access is owner-only, with
  coordinators allowed through for moderation.

  All actions expect `%{nursery: %Nursery{}}` or `%{owner: %User{}}` in params.
  """
  @behaviour Bodyguard.Policy

  alias Repousse.Accounts
  alias Repousse.Nurseries

  def authorize(:read_nursery, user, %{owner: owner}) do
    allow(Nurseries.visible_to?(owner, user))
  end

  def authorize(:read_nursery, user, %{nursery: nursery}) do
    owner = Accounts.get_user!(nursery.user_id)
    allow(Nurseries.visible_to?(owner, user))
  end

  def authorize(:manage_nursery, user, %{nursery: nursery}) do
    allow(nursery.user_id == user.id or Accounts.admin?(user))
  end

  def authorize(:list_all, user, _params), do: allow(Accounts.admin?(user))

  def authorize(_action, _user, _params), do: {:error, :unauthorized}

  defp allow(true), do: :ok
  defp allow(false), do: {:error, :unauthorized}
end
