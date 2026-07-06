defmodule RepousseWeb.ProjectController do
  use RepousseWeb, :controller
  use OpenApiSpex.ControllerSpecs
  action_fallback RepousseWeb.FallbackController

  alias Repousse.Projects
  alias Repousse.Projects.Policy
  alias RepousseWeb.OpenApiHelpers, as: API

  tags ["Projects"]
  security [%{"bearerAuth" => []}]

  operation :index,
    summary: "List planting projects",
    parameters: [
      public_only: [in: :query, type: :boolean, required: false, description: "Only return public projects"]
    ],
    responses: [ok: API.list("Planting projects")]

  def index(conn, params) do
    user_id = conn.assigns.current_user.id
    public_only = Map.get(params, "public_only", "false") == "true"
    projects = Projects.list_projects(user_id: user_id, public_only: public_only)
    json(conn, %{data: projects})
  end

  operation :show,
    summary: "Get a planting project",
    parameters: [id: [in: :path, type: :string, description: "Project ID"]],
    responses: [ok: API.object("Planting project")]

  def show(conn, %{"id" => id}) do
    project = Projects.get_project!(id)
    json(conn, %{data: project})
  end

  operation :create,
    summary: "Create a planting project",
    request_body: {"Project attributes", "application/json", %OpenApiSpex.Schema{type: :object}},
    responses: [created: API.object("Created project")]

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
    responses: [ok: API.object("Updated project")]

  def update(conn, %{"id" => id, "project" => params}) do
    project = Projects.get_project!(id)

    with {:ok, updated} <- Projects.update_project(project, params) do
      json(conn, %{data: updated})
    end
  end

  operation :archive,
    summary: "Archive a planting project",
    parameters: [id: [in: :path, type: :string, description: "Project ID"]],
    responses: [ok: API.object("Archived project")]

  def archive(conn, %{"id" => id}) do
    project = Projects.get_project!(id)

    with {:ok, archived} <- Projects.archive_project(project) do
      json(conn, %{data: archived})
    end
  end
end
