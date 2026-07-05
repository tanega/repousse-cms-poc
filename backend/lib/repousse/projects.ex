defmodule Repousse.Projects do
  @moduledoc """
  Context for planting projects (epic-04). See
  `docs/roadmap/epic-04-projets-plantation.md` for the full business rules
  this module implements.
  """

  import Ecto.Query
  alias Repousse.Accounts
  alias Repousse.Integrations.Emails
  alias Repousse.Repo
  alias Repousse.Projects.{Project, ProjectMember, ProjectInvitation, JournalEntry, ProjectMedia}

  # --- Projects ---

  @doc """
  Lists projects for the current app.

  - `public_only: true` browses public projects for discovery (US-PROJET-12)
    — deliberately ignores `user_id` so a member's own private projects never
    leak into the public feed.
  - Otherwise, lists the projects `user_id` is a member of ("my projects").
  """
  def list_projects(opts \\ []) do
    user_id = Keyword.get(opts, :user_id)
    public_only = Keyword.get(opts, :public_only, false)

    cond do
      public_only ->
        Repo.all(
          from p in Project,
            where: p.publication_status == :public,
            order_by: [desc: p.inserted_at]
        )

      user_id ->
        Repo.all(
          from p in Project,
            join: pm in ProjectMember,
            on: pm.project_id == p.id and pm.user_id == ^user_id,
            order_by: [desc: p.inserted_at]
        )

      true ->
        Repo.all(from p in Project, order_by: [desc: p.inserted_at])
    end
  end

  @doc """
  Platform-admin listing across every project, filterable by publication
  status and owner (US-PROJET-13: "Liste consultable avec filtres").
  """
  def list_all_projects(filters \\ %{}) do
    query = from p in Project, order_by: [desc: p.inserted_at]

    query =
      case fetch_filter(filters, "status") do
        nil -> query
        status -> from p in query, where: p.publication_status == ^to_status_atom(status)
      end

    query =
      case fetch_filter(filters, "owner_id") do
        nil -> query
        owner_id -> from p in query, where: p.owner_id == ^owner_id
      end

    Repo.all(query)
  end

  defp fetch_filter(filters, key) do
    case Map.get(filters, key) || Map.get(filters, String.to_existing_atom(key)) do
      nil -> nil
      "" -> nil
      value -> value
    end
  rescue
    ArgumentError -> nil
  end

  defp to_status_atom(status) when is_atom(status), do: status
  defp to_status_atom(status) when is_binary(status), do: String.to_existing_atom(status)

  def get_project!(id), do: Repo.get!(Project, id)

  @doc """
  "Seuls les utilisateurs avec le profil Adoptant ou les Administrateurs
  peuvent créer un projet" (epic-04 business rules).
  """
  def can_create_project?(%Accounts.User{} = user) do
    Accounts.admin?(user) or not is_nil(Accounts.get_profile(user.id, :adoptant))
  end

  def create_project(attrs, owner_id) do
    attrs =
      attrs
      |> merge_string(%{"owner_id" => owner_id})
      |> reject_unpublished_status()

    Ecto.Multi.new()
    |> Ecto.Multi.insert(:project, Project.create_changeset(%Project{}, attrs))
    |> Ecto.Multi.insert(:member, fn %{project: project} ->
      ProjectMember.changeset(%ProjectMember{}, %{
        project_id: project.id,
        user_id: owner_id,
        role: :admin
      })
    end)
    |> Repo.transaction()
    |> case do
      {:ok, %{project: project}} -> {:ok, project}
      {:error, :project, changeset, _} -> {:error, changeset}
    end
  end

  @doc """
  Regular admin/editor edit. `:unpublished` is a moderation-only status
  (US-PROJET-14) — it's silently stripped here so an editor/admin can't set
  it themselves; use `moderate_unpublish_project/2` for that transition.
  """
  def update_project(%Project{} = project, attrs) do
    project
    |> Project.changeset(reject_unpublished_status(attrs))
    |> Repo.update()
  end

  defp reject_unpublished_status(attrs) do
    case Map.get(attrs, "publication_status") || Map.get(attrs, :publication_status) do
      status when status in ["unpublished", :unpublished] ->
        attrs |> Map.delete("publication_status") |> Map.delete(:publication_status)

      _ ->
        attrs
    end
  end

  def archive_project(%Project{} = project) do
    project |> Project.archive_changeset() |> Repo.update()
  end

  @doc """
  US-PROJET-03 / US-PROJET-15: hard-delete a project's descriptive content
  and media. Impact data (distribution reservations referencing the project)
  is kept — the FK is nilified, not cascaded (see the reservations
  migration), which anonymizes rather than deletes it.
  """
  def delete_project(%Project{} = project), do: Repo.delete(project)

  @doc "US-PROJET-14: platform-admin unpublish with a mandatory reason, emailed to project admins."
  def moderate_unpublish_project(%Project{} = project, reason)
      when is_binary(reason) and reason != "" do
    with {:ok, updated} <- project |> Project.unpublish_changeset() |> Repo.update() do
      notify_project_admins(updated, fn admin ->
        Emails.notify_project_unpublished(admin, updated, reason)
      end)

      {:ok, updated}
    end
  end

  def moderate_unpublish_project(_project, _reason),
    do: {:error, "Un motif est requis pour dépublier un projet"}

  @doc "US-PROJET-14: platform admin republishes after a resolved dispute."
  def republish_project(%Project{} = project) do
    project |> Project.publish_changeset() |> Repo.update()
  end

  @doc "US-PROJET-15: platform-admin hard delete with a mandatory reason, emailed to project admins."
  def moderate_delete_project(%Project{} = project, reason)
      when is_binary(reason) and reason != "" do
    admins = list_admin_users(project.id)

    with {:ok, deleted} <- Repo.delete(project) do
      Enum.each(admins, &Emails.notify_project_deleted(&1, deleted, reason))
      {:ok, deleted}
    end
  end

  def moderate_delete_project(_project, _reason),
    do: {:error, "Un motif est requis pour supprimer un projet"}

  defp notify_project_admins(project, notify_fun) do
    project.id |> list_admin_users() |> Enum.each(notify_fun)
  end

  defp list_admin_users(project_id) do
    Repo.all(
      from pm in ProjectMember,
        join: u in assoc(pm, :user),
        where: pm.project_id == ^project_id and pm.role == :admin,
        select: u
    )
  end

  # --- Members ---

  def get_member_role(project_id, user_id) do
    Repo.one(
      from pm in ProjectMember,
        where: pm.project_id == ^project_id and pm.user_id == ^user_id,
        select: pm.role
    )
  end

  def get_member(project_id, user_id) do
    Repo.get_by(ProjectMember, project_id: project_id, user_id: user_id)
  end

  @doc "Flat member list with the associated user's public identity fields (US-PROJET-11)."
  def list_members(project_id) do
    Repo.all(
      from pm in ProjectMember,
        join: u in assoc(pm, :user),
        where: pm.project_id == ^project_id,
        order_by: [asc: pm.inserted_at],
        select: %{
          id: pm.id,
          role: pm.role,
          joined_at: pm.joined_at,
          user_id: u.id,
          email: u.email,
          first_name: u.first_name,
          last_name: u.last_name
        }
    )
  end

  def count_admins(project_id) do
    Repo.aggregate(
      from(pm in ProjectMember, where: pm.project_id == ^project_id and pm.role == :admin),
      :count
    )
  end

  def add_member(project_id, user_id, role \\ :reader) do
    %ProjectMember{}
    |> ProjectMember.changeset(%{project_id: project_id, user_id: user_id, role: role})
    |> Repo.insert()
  end

  @doc """
  US-PROJET-07: "Au moins un administrateur requis à tout moment" — a role
  change away from :admin is refused if it would leave the project with zero
  admins, regardless of who's making the change.
  """
  def update_member_role(%ProjectMember{} = member, new_role) do
    if member.role == :admin and new_role != :admin and count_admins(member.project_id) <= 1 do
      {:error, "Le projet doit conserver au moins un administrateur"}
    else
      member |> ProjectMember.role_changeset(new_role) |> Repo.update()
    end
  end

  @doc """
  US-PROJET-07: "Un admin ne peut pas se retirer s'il est le seul admin du
  projet" — blocks self-removal only. Someone else removing the sole admin
  (e.g. platform-admin moderation) is allowed and triggers the US-PROJET-08
  auto-archive ("archivage automatique du projet").
  """
  def remove_member(project_id, target_user_id, opts \\ []) do
    actor_id = Keyword.get(opts, :actor_id)

    case get_member(project_id, target_user_id) do
      nil ->
        {:error, :not_found}

      %ProjectMember{role: :admin} = member ->
        if target_user_id == actor_id and count_admins(project_id) <= 1 do
          {:error, "Un admin ne peut pas se retirer s'il est le seul administrateur du projet"}
        else
          do_remove_member(member)
        end

      member ->
        do_remove_member(member)
    end
  end

  defp do_remove_member(%ProjectMember{} = member) do
    with {:ok, deleted} <- Repo.delete(member) do
      maybe_auto_archive(deleted.project_id)
      {:ok, deleted}
    end
  end

  defp maybe_auto_archive(project_id) do
    if count_admins(project_id) == 0 do
      project = get_project!(project_id)

      if is_nil(project.archived_at) do
        case archive_project(project) do
          {:ok, archived} ->
            notify_remaining_members(archived)
            {:ok, archived}

          error ->
            error
        end
      end
    end
  end

  defp notify_remaining_members(%Project{} = project) do
    Repo.all(
      from pm in ProjectMember,
        join: u in assoc(pm, :user),
        where: pm.project_id == ^project.id,
        select: u
    )
    |> Enum.each(&Emails.notify_project_archived(&1, project))
  end

  # --- Invitations ---

  @doc "US-PROJET-06: invite by email with a Lecteur/Éditeur role, emailed with an acceptance link."
  def create_invitation(project_id, invited_by_id, attrs) do
    attrs = merge_string(attrs, %{"project_id" => project_id, "invited_by_id" => invited_by_id})

    %ProjectInvitation{}
    |> ProjectInvitation.changeset(attrs)
    |> Repo.insert()
  end

  @doc "Pending (not yet accepted) invitations, shown in the member list (US-PROJET-06)."
  def list_pending_invitations(project_id) do
    Repo.all(
      from i in ProjectInvitation,
        where: i.project_id == ^project_id and is_nil(i.accepted_at),
        order_by: [desc: i.inserted_at]
    )
  end

  def get_invitation_by_token(token), do: Repo.get_by(ProjectInvitation, token: token)

  @doc """
  Accepts a pending invitation: adds the invitee as a project member with the
  invited role and marks the invitation accepted (US-PROJET-06: "Après
  acceptation : projet visible dans le profil de l'utilisateur invité").

  Note: no HTTP route currently exposes this (the router's `/projects`
  scope only wires invitation *creation* — see epic-04 task scope); this is
  ready for another track to wire up once the acceptance route/flow (e.g.
  during signup) is decided.
  """
  def accept_invitation(token, %Accounts.User{} = user) do
    case get_invitation_by_token(token) do
      nil ->
        {:error, :not_found}

      %ProjectInvitation{accepted_at: accepted_at} when not is_nil(accepted_at) ->
        {:error, "Cette invitation a déjà été acceptée"}

      invitation ->
        if ProjectInvitation.expired?(invitation) do
          {:error, "Cette invitation a expiré"}
        else
          do_accept_invitation(invitation, user)
        end
    end
  end

  defp do_accept_invitation(invitation, user) do
    Ecto.Multi.new()
    |> Ecto.Multi.update(:invitation, ProjectInvitation.accept_changeset(invitation))
    |> Ecto.Multi.run(:member, fn _repo, _changes ->
      add_member(invitation.project_id, user.id, invitation.role)
    end)
    |> Repo.transaction()
    |> case do
      {:ok, %{member: member}} -> {:ok, member}
      {:error, _step, changeset, _} -> {:error, changeset}
    end
  end

  # --- Journal ---

  def list_journal_entries(project_id) do
    Repo.all(
      from j in JournalEntry,
        join: u in assoc(j, :author),
        where: j.project_id == ^project_id,
        order_by: [desc: j.inserted_at],
        select: %{
          id: j.id,
          content: j.content,
          edited_at: j.edited_at,
          inserted_at: j.inserted_at,
          project_id: j.project_id,
          author_id: u.id,
          author_first_name: u.first_name,
          author_last_name: u.last_name
        }
    )
  end

  def get_journal_entry!(id), do: Repo.get!(JournalEntry, id)

  def create_journal_entry(project_id, author_id, attrs) do
    attrs = merge_string(attrs, %{"project_id" => project_id, "author_id" => author_id})

    %JournalEntry{}
    |> JournalEntry.changeset(attrs)
    |> Repo.insert()
  end

  @doc "US-PROJET-10: only the entry's own author may edit it."
  def update_journal_entry(%JournalEntry{} = entry, author_id, attrs) do
    if entry.author_id == author_id do
      entry |> JournalEntry.update_changeset(attrs) |> Repo.update()
    else
      {:error, :forbidden}
    end
  end

  def delete_journal_entry(%JournalEntry{} = entry), do: Repo.delete(entry)

  # --- Media ---

  def list_project_media(project_id) do
    Repo.all(
      from m in ProjectMedia, where: m.project_id == ^project_id, order_by: [asc: m.inserted_at]
    )
  end

  def get_media!(id), do: Repo.get!(ProjectMedia, id)

  @doc "US-PROJET-04: capped at 10 files per project, explicit error message when exceeded."
  def add_media(project_id, uploaded_by_id, attrs) do
    count = Repo.aggregate(from(m in ProjectMedia, where: m.project_id == ^project_id), :count)

    if count >= ProjectMedia.max_files() do
      {:error, "Limite de #{ProjectMedia.max_files()} médias par projet atteinte"}
    else
      attrs =
        merge_string(attrs, %{"project_id" => project_id, "uploaded_by_id" => uploaded_by_id})

      %ProjectMedia{}
      |> ProjectMedia.changeset(attrs)
      |> Repo.insert()
    end
  end

  def delete_media(%ProjectMedia{} = media), do: Repo.delete(media)

  # --- Helpers ---

  # Normalizes `attrs` (which may arrive as string-keyed JSON params or
  # atom-keyed maps from context tests) to string keys before merging in
  # system-provided fields, avoiding `Ecto.CastError: mixed keys`.
  defp merge_string(attrs, extra) do
    attrs
    |> Enum.into(%{}, fn {k, v} -> {to_string(k), v} end)
    |> Map.merge(extra)
  end
end
