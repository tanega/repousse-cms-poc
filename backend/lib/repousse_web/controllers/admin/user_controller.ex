defmodule RepousseWeb.Admin.UserController do
  use RepousseWeb, :controller
  use OpenApiSpex.ControllerSpecs
  action_fallback RepousseWeb.FallbackController

  alias Repousse.{Accounts, Repo}
  alias Repousse.Accounts.User
  alias RepousseWeb.OpenApiHelpers, as: API
  import Ecto.Query

  tags ["Admin — Users"]
  security [%{"bearerAuth" => []}]

  operation :index,
    summary: "List users (admin)",
    responses: [ok: API.list("Users")]

  def index(conn, _params) do
    users = Repo.all(from u in User, order_by: [desc: u.inserted_at])
    json(conn, %{data: users})
  end

  operation :show,
    summary: "Get a user (admin)",
    parameters: [id: [in: :path, type: :string, description: "User ID"]],
    responses: [ok: API.object("User")]

  def show(conn, %{"id" => id}) do
    user = Accounts.get_user!(id)
    json(conn, %{data: user})
  end

  operation :create,
    summary: "Create a user (admin)",
    request_body: {"User attributes", "application/json", %OpenApiSpex.Schema{type: :object}},
    responses: [created: API.object("Created user")]

  def create(conn, %{"user" => params}) do
    with {:ok, user} <- Accounts.create_user_with_hanko(params, is_verified: true) do
      conn |> put_status(:created) |> json(%{data: user})
    end
  end

  operation :update,
    summary: "Update a user (admin)",
    parameters: [id: [in: :path, type: :string, description: "User ID"]],
    request_body: {"User attributes", "application/json", %OpenApiSpex.Schema{type: :object}},
    responses: [ok: API.object("Updated user")]

  def update(conn, %{"id" => id, "user" => params}) do
    user = Accounts.get_user!(id)
    with {:ok, updated} <- Accounts.update_user(user, params), do: json(conn, %{data: updated})
  end

  operation :delete,
    summary: "Delete a user (admin)",
    parameters: [id: [in: :path, type: :string, description: "User ID"]],
    responses: [no_content: API.no_content()]

  def delete(conn, %{"id" => id}) do
    user = Accounts.get_user!(id)
    with {:ok, _deleted} <- Accounts.delete_user(user), do: send_resp(conn, :no_content, "")
  end

  operation :suspend,
    summary: "Suspend a user (admin)",
    parameters: [id: [in: :path, type: :string, description: "User ID"]],
    responses: [ok: API.object("Suspended user")]

  def suspend(conn, %{"id" => id}) do
    user = Accounts.get_user!(id)
    with {:ok, updated} <- Accounts.suspend_user(user), do: json(conn, %{data: updated})
  end

  operation :activate,
    summary: "Activate a user (admin)",
    parameters: [id: [in: :path, type: :string, description: "User ID"]],
    responses: [ok: API.object("Activated user")]

  def activate(conn, %{"id" => id}) do
    user = Accounts.get_user!(id)
    with {:ok, updated} <- Accounts.activate_user(user), do: json(conn, %{data: updated})
  end
end
