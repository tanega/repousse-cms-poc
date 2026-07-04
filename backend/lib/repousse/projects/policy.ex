defmodule Repousse.Projects.Policy do
  @moduledoc """
  Bodyguard authorization for planting projects (epic-04). Per-project roles
  (`admin | editor | reader`, see `Repousse.Projects.ProjectMember`) combine
  with the platform-wide `admin`/`superadmin` role, which always bypasses
  project-level restrictions for moderation (US-PROJET-13/14/15).

  All actions expect `%{project: %Project{}}` in params.
  """
  @behaviour Bodyguard.Policy

  alias Repousse.Accounts
  alias Repousse.Projects

  def authorize(:read_project, user, %{project: project}) do
    allow(
      project.publication_status == :public or Accounts.admin?(user) or
        not is_nil(member_role(project, user))
    )
  end

  def authorize(action, user, %{project: project})
      when action in [:edit_project, :post_journal, :manage_media] do
    allow(Accounts.admin?(user) or member_role(project, user) in [:admin, :editor])
  end

  def authorize(:manage_members, user, %{project: project}) do
    allow(Accounts.admin?(user) or member_role(project, user) == :admin)
  end

  # Platform-level moderation: unpublish/delete any project (US-PROJET-13/14/15).
  def authorize(:moderate, user, _params), do: allow(Accounts.admin?(user))

  def authorize(_action, _user, _params), do: {:error, :unauthorized}

  defp member_role(project, user), do: Projects.get_member_role(project.id, user.id)

  defp allow(true), do: :ok
  defp allow(false), do: {:error, :unauthorized}
end
