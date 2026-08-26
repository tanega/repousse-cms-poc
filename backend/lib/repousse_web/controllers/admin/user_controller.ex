defmodule RepousseWeb.Admin.UserController do
  use RepousseWeb, :controller
  use OpenApiSpex.ControllerSpecs
  action_fallback RepousseWeb.FallbackController

  alias Repousse.{Accounts, Repo}
  alias Repousse.Accounts.{Policy, User}
  alias RepousseWeb.OpenApiHelpers, as: API
  alias RepousseWeb.Schemas.User, as: UserSchema
  import Ecto.Query

  tags ["Admin — Users"]
  security [%{"bearerAuth" => []}]

  operation :index,
    summary: "List users (admin)",
    responses: [ok: API.list(UserSchema, "Users")]

  def index(conn, _params) do
    current_user = conn.assigns.current_user

    with :ok <- Bodyguard.permit(Policy, :manage_users, current_user, %{}) do
      users = Repo.all(from u in User, order_by: [desc: u.inserted_at]) |> Repo.preload(:profiles)
      json(conn, %{data: users})
    end
  end

  operation :show,
    summary: "Get a user (admin)",
    parameters: [id: [in: :path, type: :string, description: "User ID"]],
    responses: [ok: API.object(UserSchema, "User")]

  def show(conn, %{"id" => id}) do
    current_user = conn.assigns.current_user

    with :ok <- Bodyguard.permit(Policy, :manage_users, current_user, %{}) do
      user = Accounts.get_user!(id) |> Repo.preload(:profiles)
      json(conn, %{data: user})
    end
  end

  operation :create,
    summary: "Create a user (admin)",
    request_body: {"User attributes", "application/json", %OpenApiSpex.Schema{type: :object}},
    responses: [created: API.object(UserSchema, "Created user")]

  def create(conn, %{"user" => params}) do
    current_user = conn.assigns.current_user

    with {:ok, role} <- cast_role(params["role"] || "member"),
         :ok <- Bodyguard.permit(Policy, :create_user, current_user, %{role: role}),
         {:ok, user} <- Accounts.create_user_with_hanko(params, is_verified: true),
         {:ok, user} <- maybe_assign_role(user, role) do
      conn |> put_status(:created) |> json(%{data: Repo.preload(user, :profiles)})
    end
  end

  operation :update,
    summary: "Update a user (admin)",
    parameters: [id: [in: :path, type: :string, description: "User ID"]],
    request_body: {"User attributes", "application/json", %OpenApiSpex.Schema{type: :object}},
    responses: [ok: API.object(UserSchema, "Updated user")]

  def update(conn, %{"id" => id, "user" => params}) do
    current_user = conn.assigns.current_user

    with :ok <- Bodyguard.permit(Policy, :manage_users, current_user, %{}) do
      user = Accounts.get_user!(id) |> Repo.preload(:profiles)
      with {:ok, updated} <- Accounts.update_user(user, params), do: json(conn, %{data: updated})
    end
  end

  operation :delete,
    summary: "Delete a user (admin)",
    parameters: [id: [in: :path, type: :string, description: "User ID"]],
    responses: [no_content: API.no_content()]

  def delete(conn, %{"id" => id}) do
    current_user = conn.assigns.current_user

    with :ok <- Bodyguard.permit(Policy, :manage_users, current_user, %{}) do
      user = Accounts.get_user!(id) |> Repo.preload(:profiles)
      with {:ok, _deleted} <- Accounts.delete_user(user), do: send_resp(conn, :no_content, "")
    end
  end

  operation :suspend,
    summary: "Suspend a user (admin)",
    parameters: [id: [in: :path, type: :string, description: "User ID"]],
    responses: [ok: API.object(UserSchema, "Suspended user")]

  def suspend(conn, %{"id" => id}) do
    current_user = conn.assigns.current_user

    with :ok <- Bodyguard.permit(Policy, :suspend_user, current_user, %{}) do
      user = Accounts.get_user!(id) |> Repo.preload(:profiles)
      with {:ok, updated} <- Accounts.suspend_user(user), do: json(conn, %{data: updated})
    end
  end

  operation :activate,
    summary: "Activate a user (admin)",
    parameters: [id: [in: :path, type: :string, description: "User ID"]],
    responses: [ok: API.object(UserSchema, "Activated user")]

  def activate(conn, %{"id" => id}) do
    current_user = conn.assigns.current_user

    with :ok <- Bodyguard.permit(Policy, :suspend_user, current_user, %{}) do
      user = Accounts.get_user!(id) |> Repo.preload(:profiles)
      with {:ok, updated} <- Accounts.activate_user(user), do: json(conn, %{data: updated})
    end
  end

  operation :update_role,
    summary: "Assign a role to a user (superadmin)",
    parameters: [id: [in: :path, type: :string, description: "User ID"]],
    request_body:
      {"Role", "application/json",
       %OpenApiSpex.Schema{
         type: :object,
         properties: %{role: %OpenApiSpex.Schema{type: :string, enum: ["member", "admin", "superadmin"]}}
       }},
    responses: [ok: API.object(UserSchema, "Updated user")]

  def update_role(conn, %{"id" => id, "role" => role_param}) do
    current_user = conn.assigns.current_user

    with :ok <- Bodyguard.permit(Policy, :assign_role, current_user, %{}),
         {:ok, role} <- cast_role(role_param) do
      user = Accounts.get_user!(id) |> Repo.preload(:profiles)
      with {:ok, updated} <- Accounts.assign_role(user, role), do: json(conn, %{data: updated})
    end
  end

  defp maybe_assign_role(user, :member), do: {:ok, user}
  defp maybe_assign_role(user, role), do: Accounts.assign_role(user, role)

  defp cast_role(role) when role in ["member", "admin", "superadmin"], do: {:ok, String.to_existing_atom(role)}
  defp cast_role(_role), do: {:error, "Invalid role"}
end
