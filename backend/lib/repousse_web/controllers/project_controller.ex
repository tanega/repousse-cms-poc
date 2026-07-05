defmodule RepousseWeb.ProjectController do
  use RepousseWeb, :controller
  use OpenApiSpex.ControllerSpecs
  action_fallback RepousseWeb.FallbackController

  alias Repousse.Accounts
  alias Repousse.Projects
  alias Repousse.Projects.Policy

  tags(["projects"])

  operation(:index,
    summary: "List planting projects",
    description:
      "Lists the current user's projects, public projects (public_only=true), " <>
        "or every project for platform admins (all=true).",
    parameters: [
      public_only: [in: :query, type: :boolean, required: false],
      all: [in: :query, type: :boolean, required: false],
      status: [in: :query, type: :string, required: false],
      owner_id: [in: :query, type: :string, required: false]
    ],
    responses: [ok: "List of projects"]
  )

  def index(conn, params) do
    user = conn.assigns.current_user

    projects =
      if Accounts.admin?(user) and Map.get(params, "all") == "true" do
        Projects.list_all_projects(Map.take(params, ["status", "owner_id"]))
      else
        public_only = Map.get(params, "public_only", "false") == "true"
        Projects.list_projects(user_id: user.id, public_only: public_only)
      end

    json(conn, %{data: projects})
  end

  operation(:show,
    summary: "Get a planting project",
    parameters: [id: [in: :path, type: :string, required: true]],
    responses: [
      ok: "Project details",
      not_found: "Project not found",
      unauthorized: "Not authorized"
    ]
  )

  def show(conn, %{"id" => id}) do
    project = Projects.get_project!(id)
    user = conn.assigns.current_user

    with :ok <- Bodyguard.permit(Policy, :read_project, user, %{project: project}) do
      json(conn, %{data: project})
    end
  end

  operation(:create,
    summary: "Create a planting project",
    description: "Only Adoptant profiles or platform admins may create a project.",
    request_body: {"Project params", "application/json", nil},
    responses: [created: "Project created", unauthorized: "Not authorized"]
  )

  def create(conn, %{"project" => params}) do
    user = conn.assigns.current_user

    if Projects.can_create_project?(user) do
      with {:ok, project} <- Projects.create_project(params, user.id) do
        conn |> put_status(:created) |> json(%{data: project})
      end
    else
      {:error, :unauthorized}
    end
  end

  operation(:update,
    summary: "Update a planting project",
    description:
      "Project admin/editor edits (name, description, ...). Platform admins can also use this " <>
        "endpoint with publication_status: \"unpublished\"/\"public\" plus a reason to " <>
        "moderate (US-PROJET-14).",
    parameters: [id: [in: :path, type: :string, required: true]],
    request_body: {"Project params", "application/json", nil},
    responses: [ok: "Project updated", unauthorized: "Not authorized"]
  )

  def update(conn, %{"id" => id, "project" => params} = full_params) do
    project = Projects.get_project!(id)
    user = conn.assigns.current_user
    reason = Map.get(params, "reason") || Map.get(full_params, "reason")

    cond do
      unpublish_requested?(params) ->
        with :ok <- Bodyguard.permit(Policy, :moderate, user, %{project: project}),
             {:ok, updated} <- Projects.moderate_unpublish_project(project, reason) do
          json(conn, %{data: updated})
        end

      republish_requested?(params, project) ->
        with :ok <- Bodyguard.permit(Policy, :moderate, user, %{project: project}),
             {:ok, updated} <- Projects.republish_project(project) do
          json(conn, %{data: updated})
        end

      true ->
        with :ok <- Bodyguard.permit(Policy, :edit_project, user, %{project: project}),
             {:ok, updated} <- Projects.update_project(project, params) do
          json(conn, %{data: updated})
        end
    end
  end

  defp unpublish_requested?(params),
    do: Map.get(params, "publication_status") in ["unpublished", :unpublished]

  defp republish_requested?(params, project) do
    project.publication_status == :unpublished and
      Map.get(params, "publication_status") in ["public", :public]
  end

  operation(:delete,
    summary: "Delete a planting project",
    description:
      "A project admin deletes their own project (US-PROJET-03), or a platform admin " <>
        "moderation-deletes any project by passing a reason (US-PROJET-15).",
    parameters: [
      id: [in: :path, type: :string, required: true],
      reason: [in: :query, type: :string, required: false]
    ],
    responses: [no_content: "Project deleted", unauthorized: "Not authorized"]
  )

  def delete(conn, %{"id" => id} = params) do
    project = Projects.get_project!(id)
    user = conn.assigns.current_user
    reason = Map.get(params, "reason")

    if Accounts.admin?(user) and is_binary(reason) and reason != "" do
      with :ok <- Bodyguard.permit(Policy, :moderate, user, %{project: project}),
           {:ok, _deleted} <- Projects.moderate_delete_project(project, reason) do
        send_resp(conn, :no_content, "")
      end
    else
      with :ok <- Bodyguard.permit(Policy, :manage_members, user, %{project: project}),
           {:ok, _deleted} <- Projects.delete_project(project) do
        send_resp(conn, :no_content, "")
      end
    end
  end

  operation(:members,
    summary: "List a project's members",
    parameters: [id: [in: :path, type: :string, required: true]],
    responses: [ok: "List of members", unauthorized: "Not authorized"]
  )

  def members(conn, %{"id" => id}) do
    project = Projects.get_project!(id)
    user = conn.assigns.current_user

    with :ok <- Bodyguard.permit(Policy, :read_project, user, %{project: project}) do
      json(conn, %{data: Projects.list_members(project.id)})
    end
  end

  operation(:invite,
    summary: "Invite a member to a project",
    description: "Project-admin only. Invites by email with a Lecteur or Éditeur role.",
    parameters: [id: [in: :path, type: :string, required: true]],
    request_body: {"Invitation params", "application/json", nil},
    responses: [created: "Invitation created", unauthorized: "Not authorized"]
  )

  def invite(conn, %{"id" => id, "invitation" => params}) do
    project = Projects.get_project!(id)
    user = conn.assigns.current_user

    with :ok <- Bodyguard.permit(Policy, :manage_members, user, %{project: project}),
         {:ok, invitation} <- Projects.create_invitation(project.id, user.id, params) do
      Repousse.Integrations.Emails.send_project_invitation(invitation, project)
      conn |> put_status(:created) |> json(%{data: invitation})
    end
  end

  operation(:update_member,
    summary: "Change a project member's role",
    description: "Project-admin only. At least one admin must remain at all times.",
    parameters: [
      id: [in: :path, type: :string, required: true],
      user_id: [in: :path, type: :string, required: true]
    ],
    request_body: {"Member params", "application/json", nil},
    responses: [ok: "Member updated", unauthorized: "Not authorized"]
  )

  def update_member(conn, %{"id" => id, "user_id" => member_user_id} = params) do
    project = Projects.get_project!(id)
    user = conn.assigns.current_user
    role_param = get_in(params, ["member", "role"])

    with :ok <- Bodyguard.permit(Policy, :manage_members, user, %{project: project}),
         {:ok, role} <- parse_role(role_param),
         %Projects.ProjectMember{} = member <-
           Projects.get_member(project.id, member_user_id) || {:error, :not_found},
         {:ok, updated} <- Projects.update_member_role(member, role) do
      json(conn, %{data: updated})
    end
  end

  defp parse_role(role) when role in ["admin", "editor", "reader"],
    do: {:ok, String.to_existing_atom(role)}

  defp parse_role(_role), do: {:error, "Rôle invalide"}

  operation(:remove_member,
    summary: "Remove a member from a project",
    description:
      "Project-admin only. An admin cannot remove themselves if they're the project's " <>
        "sole admin; if the sole admin is removed by someone else, the project auto-archives.",
    parameters: [
      id: [in: :path, type: :string, required: true],
      user_id: [in: :path, type: :string, required: true]
    ],
    responses: [no_content: "Member removed", unauthorized: "Not authorized"]
  )

  def remove_member(conn, %{"id" => id, "user_id" => member_user_id}) do
    project = Projects.get_project!(id)
    user = conn.assigns.current_user

    with :ok <- Bodyguard.permit(Policy, :manage_members, user, %{project: project}),
         {:ok, _removed} <- Projects.remove_member(project.id, member_user_id, actor_id: user.id) do
      send_resp(conn, :no_content, "")
    end
  end

  operation(:upload_media,
    summary: "Add a media file to a project",
    description: "Project admin/editor only, capped at 10 files per project.",
    parameters: [id: [in: :path, type: :string, required: true]],
    request_body: {"Media params", "application/json", nil},
    responses: [created: "Media added", unauthorized: "Not authorized"]
  )

  def upload_media(conn, %{"id" => id, "media" => params}) do
    project = Projects.get_project!(id)
    user = conn.assigns.current_user

    with :ok <- Bodyguard.permit(Policy, :manage_media, user, %{project: project}),
         {:ok, media} <- Projects.add_media(project.id, user.id, params) do
      conn |> put_status(:created) |> json(%{data: media})
    end
  end

  operation(:delete_media,
    summary: "Delete a project media file",
    parameters: [
      id: [in: :path, type: :string, required: true],
      media_id: [in: :path, type: :string, required: true]
    ],
    responses: [no_content: "Media deleted", unauthorized: "Not authorized"]
  )

  def delete_media(conn, %{"id" => id, "media_id" => media_id}) do
    project = Projects.get_project!(id)
    user = conn.assigns.current_user
    media = Projects.get_media!(media_id)

    with :ok <- Bodyguard.permit(Policy, :manage_media, user, %{project: project}),
         {:ok, _deleted} <- Projects.delete_media(media) do
      send_resp(conn, :no_content, "")
    end
  end

  operation(:journal,
    summary: "List a project's journal entries",
    parameters: [id: [in: :path, type: :string, required: true]],
    responses: [ok: "List of journal entries", unauthorized: "Not authorized"]
  )

  def journal(conn, %{"id" => id}) do
    project = Projects.get_project!(id)
    user = conn.assigns.current_user

    with :ok <- Bodyguard.permit(Policy, :read_project, user, %{project: project}) do
      json(conn, %{data: Projects.list_journal_entries(project.id)})
    end
  end

  operation(:add_journal_entry,
    summary: "Post a journal entry",
    description: "Project admin/editor only. Readers may consult the journal but not post.",
    parameters: [id: [in: :path, type: :string, required: true]],
    request_body: {"Journal entry params", "application/json", nil},
    responses: [created: "Entry created", unauthorized: "Not authorized"]
  )

  def add_journal_entry(conn, %{"id" => id, "journal_entry" => params}) do
    project = Projects.get_project!(id)
    user = conn.assigns.current_user

    with :ok <- Bodyguard.permit(Policy, :post_journal, user, %{project: project}),
         {:ok, entry} <- Projects.create_journal_entry(project.id, user.id, params) do
      conn |> put_status(:created) |> json(%{data: entry})
    end
  end

  operation(:update_journal_entry,
    summary: "Edit a journal entry",
    description: "Only the entry's own author may edit it (US-PROJET-10).",
    parameters: [
      project_id: [in: :path, type: :string, required: true],
      entry_id: [in: :path, type: :string, required: true]
    ],
    request_body: {"Journal entry params", "application/json", nil},
    responses: [ok: "Entry updated", forbidden: "Not the author"]
  )

  def update_journal_entry(conn, %{
        "project_id" => project_id,
        "entry_id" => entry_id,
        "journal_entry" => params
      }) do
    project = Projects.get_project!(project_id)
    entry = Projects.get_journal_entry!(entry_id)
    user = conn.assigns.current_user

    with :ok <- Bodyguard.permit(Policy, :read_project, user, %{project: project}),
         {:ok, updated} <- Projects.update_journal_entry(entry, user.id, params) do
      json(conn, %{data: updated})
    end
  end

  operation(:delete_journal_entry,
    summary: "Delete a journal entry",
    description:
      "The entry's author, or a project admin (moderation), or a platform admin may delete it.",
    parameters: [
      project_id: [in: :path, type: :string, required: true],
      entry_id: [in: :path, type: :string, required: true]
    ],
    responses: [no_content: "Entry deleted", unauthorized: "Not authorized"]
  )

  def delete_journal_entry(conn, %{"project_id" => project_id, "entry_id" => entry_id}) do
    project = Projects.get_project!(project_id)
    entry = Projects.get_journal_entry!(entry_id)
    user = conn.assigns.current_user

    with :ok <- authorize_entry_delete(project, entry, user),
         {:ok, _deleted} <- Projects.delete_journal_entry(entry) do
      send_resp(conn, :no_content, "")
    end
  end

  defp authorize_entry_delete(project, entry, user) do
    if entry.author_id == user.id do
      :ok
    else
      Bodyguard.permit(Policy, :manage_members, user, %{project: project})
    end
  end
end
