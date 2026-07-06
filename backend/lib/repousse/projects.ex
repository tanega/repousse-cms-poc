defmodule Repousse.Projects do
  import Ecto.Query
  alias Repousse.Repo
  alias Repousse.Projects.{Project, ProjectMember, ProjectInvitation, JournalEntry, ProjectMedia}

  # --- Projects ---

  def list_projects(opts \\ []) do
    user_id = Keyword.get(opts, :user_id)
    public_only = Keyword.get(opts, :public_only, false)

    query =
      from p in Project,
        order_by: [desc: p.inserted_at]

    query =
      if user_id do
        from p in query,
          join: pm in ProjectMember,
          on: pm.project_id == p.id and pm.user_id == ^user_id
      else
        query
      end

    query =
      if public_only do
        from p in query, where: p.publication_status == :public
      else
        query
      end

    Repo.all(query)
  end

  def get_project!(id), do: Repo.get!(Project, id)

  def create_project(attrs, owner_id) do
    Ecto.Multi.new()
    |> Ecto.Multi.insert(:project, Project.changeset(%Project{}, attrs))
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

  def update_project(%Project{} = project, attrs) do
    project |> Project.changeset(attrs) |> Repo.update()
  end

  def archive_project(%Project{} = project) do
    project |> Project.archive_changeset() |> Repo.update()
  end

  # --- Members ---

  def get_member_role(project_id, user_id) do
    Repo.one(
      from pm in ProjectMember,
        where: pm.project_id == ^project_id and pm.user_id == ^user_id,
        select: pm.role
    )
  end

  def add_member(project_id, user_id, role \\ :reader) do
    %ProjectMember{}
    |> ProjectMember.changeset(%{project_id: project_id, user_id: user_id, role: role})
    |> Repo.insert()
  end

  def remove_member(project_id, user_id) do
    Repo.delete_all(
      from pm in ProjectMember,
        where: pm.project_id == ^project_id and pm.user_id == ^user_id
    )
  end

  # --- Invitations ---

  def create_invitation(project_id, email) do
    %ProjectInvitation{}
    |> ProjectInvitation.changeset(%{
      project_id: project_id,
      email: email,
      token: :crypto.strong_rand_bytes(32) |> Base.url_encode64(padding: false),
      expires_at: DateTime.add(DateTime.utc_now(), 7 * 24 * 3600, :second)
    })
    |> Repo.insert()
  end

  def get_invitation_by_token(token) do
    Repo.get_by(ProjectInvitation, token: token)
  end

  # --- Journal ---

  def list_journal_entries(project_id) do
    Repo.all(from j in JournalEntry, where: j.project_id == ^project_id, order_by: [desc: j.inserted_at])
  end

  def create_journal_entry(project_id, author_id, attrs) do
    %JournalEntry{}
    |> JournalEntry.changeset(Map.merge(attrs, %{project_id: project_id, author_id: author_id}))
    |> Repo.insert()
  end

  def update_journal_entry(%JournalEntry{} = entry, author_id, attrs) do
    if entry.author_id == author_id do
      entry |> JournalEntry.update_changeset(attrs) |> Repo.update()
    else
      {:error, :forbidden}
    end
  end

  # --- Media ---

  def list_project_media(project_id) do
    Repo.all(from m in ProjectMedia, where: m.project_id == ^project_id, order_by: m.position)
  end

  def add_media(project_id, uploader_id, attrs) do
    count = Repo.aggregate(from(m in ProjectMedia, where: m.project_id == ^project_id), :count)

    if count >= 10 do
      {:error, :max_files_reached}
    else
      %ProjectMedia{}
      |> ProjectMedia.changeset(
        Map.merge(attrs, %{
          "project_id" => project_id,
          "uploaded_by_id" => uploader_id,
          "position" => count + 1
        })
      )
      |> Repo.insert()
    end
  end

  def delete_media(%ProjectMedia{} = media) do
    Repo.delete(media)
  end
end
