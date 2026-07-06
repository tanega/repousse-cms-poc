defmodule RepousseWeb.ProjectController do
  use RepousseWeb, :controller
  use OpenApiSpex.ControllerSpecs
  action_fallback RepousseWeb.FallbackController

  alias Repousse.Projects
  alias Repousse.Projects.Policy
  alias RepousseWeb.OpenApiHelpers, as: API
  alias RepousseWeb.Schemas.{Project, ProjectInvitation, ProjectMedia, ProjectMember, JournalEntry}

  tags ["Projects"]
  security [%{"bearerAuth" => []}]

  operation :index,
    summary: "List planting projects",
    parameters: [
      public_only: [in: :query, type: :boolean, required: false, description: "Only return public projects"]
    ],
    responses: [ok: API.list(Project, "Planting projects")]

  def index(conn, params) do
    user_id = conn.assigns.current_user.id
    public_only = Map.get(params, "public_only", "false") == "true"
    projects = Projects.list_projects(user_id: user_id, public_only: public_only)
    json(conn, %{data: projects})
  end

  operation :show,
    summary: "Get a planting project",
    parameters: [id: [in: :path, type: :string, description: "Project ID"]],
    responses: [ok: API.object(Project, "Planting project")]

  def show(conn, %{"id" => id}) do
    project = Projects.get_project!(id)
    json(conn, %{data: project})
  end

  operation :create,
    summary: "Create a planting project",
    request_body: {"Project attributes", "application/json", %OpenApiSpex.Schema{type: :object}},
    responses: [created: API.object(Project, "Created project")]

  def create(conn, %{"project" => params}) do
    user_id = conn.assigns.current_user.id

    with {:ok, project} <- Projects.create_project(params, user_id) do
      conn |> put_status(:created) |> json(%{data: project})
    end
  end

  operation :update,
    summary: "Update a planting project",
    parameters: [id: [in: :path, type: :string, description: "Project ID"]],
    request_body: {"Project attributes", "application/json", %OpenApiSpex.Schema{type: :object}},
    responses: [ok: API.object(Project, "Updated project")]

  def update(conn, %{"id" => id, "project" => params}) do
    project = Projects.get_project!(id)

    with {:ok, updated} <- Projects.update_project(project, params) do
      json(conn, %{data: updated})
    end
  end

  operation :archive,
    summary: "Archive a planting project",
    parameters: [id: [in: :path, type: :string, description: "Project ID"]],
    responses: [ok: API.object(Project, "Archived project")]

  def archive(conn, %{"id" => id}) do
    project = Projects.get_project!(id)

    with {:ok, archived} <- Projects.archive_project(project) do
      json(conn, %{data: archived})
    end
  end

  operation :members,
    summary: "List a project's members",
    parameters: [id: [in: :path, type: :string, description: "Project ID"]],
    responses: [ok: API.list(ProjectMember, "Project members")]

  def members(conn, %{"id" => id}) do
    project = Projects.get_project!(id)
    user = conn.assigns.current_user

    with :ok <- Bodyguard.permit(Policy, :read_project, user, %{project: project}) do
      json(conn, %{data: Projects.list_members(id)})
    end
  end

  operation :invite,
    summary: "Invite a member to a project by email",
    parameters: [id: [in: :path, type: :string, description: "Project ID"]],
    request_body:
      {"Invitation attributes (email, role)", "application/json", %OpenApiSpex.Schema{type: :object}},
    responses: [created: API.object(ProjectInvitation, "Created invitation")]

  def invite(conn, %{"id" => id, "invitation" => %{"email" => email} = params}) do
    project = Projects.get_project!(id)
    user = conn.assigns.current_user
    role = Map.get(params, "role", "reader")

    with :ok <- Bodyguard.permit(Policy, :manage_members, user, %{project: project}),
         {:ok, invitation} <- Projects.create_invitation(id, user.id, email, role) do
      conn |> put_status(:created) |> json(%{data: invitation})
    end
  end

  operation :update_member,
    summary: "Update a project member's role",
    parameters: [
      id: [in: :path, type: :string, description: "Project ID"],
      user_id: [in: :path, type: :string, description: "User ID"]
    ],
    request_body: {"Member attributes (role)", "application/json", %OpenApiSpex.Schema{type: :object}},
    responses: [ok: API.object(ProjectMember, "Updated member")]

  def update_member(conn, %{"id" => id, "user_id" => user_id, "member" => %{"role" => role}}) do
    project = Projects.get_project!(id)
    current_user = conn.assigns.current_user
    member = Projects.get_member!(id, user_id)

    with :ok <- Bodyguard.permit(Policy, :manage_members, current_user, %{project: project}),
         {:ok, updated} <- Projects.update_member_role(member, role) do
      json(conn, %{data: updated})
    end
  end

  operation :remove_member,
    summary: "Remove a member from a project",
    parameters: [
      id: [in: :path, type: :string, description: "Project ID"],
      user_id: [in: :path, type: :string, description: "User ID"]
    ],
    responses: [no_content: API.no_content()]

  def remove_member(conn, %{"id" => id, "user_id" => user_id}) do
    project = Projects.get_project!(id)
    user = conn.assigns.current_user

    with :ok <- Bodyguard.permit(Policy, :manage_members, user, %{project: project}) do
      Projects.remove_member(id, user_id)
      send_resp(conn, :no_content, "")
    end
  end

  operation :upload_media,
    summary: "Add a media item to a project",
    parameters: [id: [in: :path, type: :string, description: "Project ID"]],
    request_body: {"Media attributes", "application/json", %OpenApiSpex.Schema{type: :object}},
    responses: [created: API.object(ProjectMedia, "Created media")]

  def upload_media(conn, %{"id" => id, "media" => params}) do
    project = Projects.get_project!(id)
    user = conn.assigns.current_user

    with :ok <- Bodyguard.permit(Policy, :manage_media, user, %{project: project}),
         {:ok, media} <- Projects.add_media(id, user.id, params) do
      conn |> put_status(:created) |> json(%{data: media})
    end
  end

  operation :delete_media,
    summary: "Delete a project media item",
    parameters: [
      id: [in: :path, type: :string, description: "Project ID"],
      media_id: [in: :path, type: :string, description: "Media ID"]
    ],
    responses: [no_content: API.no_content()]

  def delete_media(conn, %{"id" => id, "media_id" => media_id}) do
    project = Projects.get_project!(id)
    user = conn.assigns.current_user
    media = Projects.get_media!(media_id)

    with :ok <- Bodyguard.permit(Policy, :manage_media, user, %{project: project}),
         {:ok, _} <- Projects.delete_media(media) do
      send_resp(conn, :no_content, "")
    end
  end

  operation :journal,
    summary: "List a project's journal entries",
    parameters: [id: [in: :path, type: :string, description: "Project ID"]],
    responses: [ok: API.list(JournalEntry, "Journal entries")]

  def journal(conn, %{"id" => id}) do
    project = Projects.get_project!(id)
    user = conn.assigns.current_user

    with :ok <- Bodyguard.permit(Policy, :read_project, user, %{project: project}) do
      json(conn, %{data: Projects.list_journal_entries(id)})
    end
  end

  operation :add_journal_entry,
    summary: "Add a journal entry to a project",
    parameters: [id: [in: :path, type: :string, description: "Project ID"]],
    request_body:
      {"Journal entry attributes (content)", "application/json", %OpenApiSpex.Schema{type: :object}},
    responses: [created: API.object(JournalEntry, "Created journal entry")]

  def add_journal_entry(conn, %{"id" => id, "journal_entry" => params}) do
    project = Projects.get_project!(id)
    user = conn.assigns.current_user

    with :ok <- Bodyguard.permit(Policy, :post_journal, user, %{project: project}),
         {:ok, entry} <- Projects.create_journal_entry(id, user.id, params) do
      conn |> put_status(:created) |> json(%{data: entry})
    end
  end

  operation :update_journal_entry,
    summary: "Update a journal entry",
    parameters: [
      project_id: [in: :path, type: :string, description: "Project ID"],
      entry_id: [in: :path, type: :string, description: "Journal entry ID"]
    ],
    request_body:
      {"Journal entry attributes (content)", "application/json", %OpenApiSpex.Schema{type: :object}},
    responses: [ok: API.object(JournalEntry, "Updated journal entry")]

  def update_journal_entry(conn, %{"entry_id" => entry_id, "journal_entry" => params}) do
    entry = Projects.get_journal_entry!(entry_id)
    user = conn.assigns.current_user

    with {:ok, updated} <- Projects.update_journal_entry(entry, user.id, params) do
      json(conn, %{data: updated})
    end
  end

  operation :delete_journal_entry,
    summary: "Delete a journal entry",
    parameters: [
      project_id: [in: :path, type: :string, description: "Project ID"],
      entry_id: [in: :path, type: :string, description: "Journal entry ID"]
    ],
    responses: [no_content: API.no_content()]

  def delete_journal_entry(conn, %{"entry_id" => entry_id}) do
    entry = Projects.get_journal_entry!(entry_id)
    user = conn.assigns.current_user

    with {:ok, _} <- Projects.delete_journal_entry(entry, user.id) do
      send_resp(conn, :no_content, "")
    end
  end
end
