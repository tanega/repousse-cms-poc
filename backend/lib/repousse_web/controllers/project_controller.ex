defmodule RepousseWeb.ProjectController do
  use RepousseWeb, :controller
  action_fallback RepousseWeb.FallbackController

  alias Repousse.Projects

  def index(conn, params) do
    user_id = conn.assigns.current_user.id
    public_only = Map.get(params, "public_only", "false") == "true"
    projects = Projects.list_projects(user_id: user_id, public_only: public_only)
    json(conn, %{data: projects})
  end

  def show(conn, %{"id" => id}) do
    project = Projects.get_project!(id)
    json(conn, %{data: project})
  end

  def create(conn, %{"project" => params}) do
    user_id = conn.assigns.current_user.id

    with {:ok, project} <- Projects.create_project(params, user_id) do
      conn |> put_status(:created) |> json(%{data: project})
    end
  end

  def update(conn, %{"id" => id, "project" => params}) do
    project = Projects.get_project!(id)

    with {:ok, updated} <- Projects.update_project(project, params) do
      json(conn, %{data: updated})
    end
  end

  def archive(conn, %{"id" => id}) do
    project = Projects.get_project!(id)

    with {:ok, archived} <- Projects.archive_project(project) do
      json(conn, %{data: archived})
    end
  end
end
