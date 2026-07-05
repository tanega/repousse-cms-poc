defmodule RepousseWeb.Admin.UserController do
  use RepousseWeb, :controller
  use OpenApiSpex.ControllerSpecs
  action_fallback RepousseWeb.FallbackController

  alias OpenApiSpex.Schema
  alias Repousse.{Accounts, Repo}
  alias Repousse.Accounts.{Policy, User}
  import Ecto.Query

  tags(["admin-users"])
  security([%{"bearerAuth" => []}])

  @user_schema %Schema{type: :object}
  @error_schema %Schema{type: :object, properties: %{error: %Schema{type: :string}}}

  operation(:index,
    summary: "List users",
    description: "Epic-02 US-AUTH-10/11 — admin/superadmin only (Accounts.Policy :manage_users).",
    responses: [
      ok:
        {"Users list", "application/json",
         %Schema{type: :object, properties: %{data: %Schema{type: :array, items: @user_schema}}}},
      unauthorized: {"Not an admin", "application/json", @error_schema}
    ]
  )

  def index(conn, _params) do
    with :ok <- Bodyguard.permit(Policy, :manage_users, conn.assigns.current_user, %{}) do
      users =
        from(u in User, order_by: [desc: u.inserted_at])
        |> Repo.all()
        |> Repo.preload(:profiles)

      json(conn, %{data: users})
    end
  end

  operation(:show,
    summary: "Show a user",
    parameters: [id: [in: :path, type: :string, required: true]],
    responses: [
      ok: {"User", "application/json", %Schema{type: :object, properties: %{data: @user_schema}}},
      unauthorized: {"Not an admin", "application/json", @error_schema}
    ]
  )

  def show(conn, %{"id" => id}) do
    with :ok <- Bodyguard.permit(Policy, :manage_users, conn.assigns.current_user, %{}) do
      user = Accounts.get_user!(id) |> preload_profiles()
      json(conn, %{data: user})
    end
  end

  operation(:create,
    summary: "Create a user (epic-02 US-AUTH-10)",
    description: """
    Admin-created account, outside the HelloAsso sync flow. An Admin cannot
    create an admin or superadmin account (only a Superadmin can, via the
    `role` param) — enforced by `Accounts.Policy` `:create_user`.
    """,
    request_body: {"User params", "application/json", %Schema{type: :object}},
    responses: [
      created:
        {"User", "application/json", %Schema{type: :object, properties: %{data: @user_schema}}},
      unauthorized:
        {"Not allowed to create a user with this role", "application/json", @error_schema}
    ]
  )

  def create(conn, %{"user" => params}) do
    requested_role = requested_role(params)

    with :ok <-
           Bodyguard.permit(Policy, :create_user, conn.assigns.current_user, %{
             role: requested_role
           }),
         {:ok, user} <- Accounts.create_user_with_hanko(params, is_verified: true),
         {:ok, user} <-
           maybe_assign_requested_role(user, requested_role, conn.assigns.current_user) do
      conn |> put_status(:created) |> json(%{data: preload_profiles(user)})
    end
  end

  operation(:update,
    summary: "Update a user",
    parameters: [id: [in: :path, type: :string, required: true]],
    request_body: {"User params", "application/json", %Schema{type: :object}},
    responses: [
      ok: {"User", "application/json", %Schema{type: :object, properties: %{data: @user_schema}}},
      unauthorized: {"Not an admin", "application/json", @error_schema}
    ]
  )

  def update(conn, %{"id" => id, "user" => params}) do
    with :ok <- Bodyguard.permit(Policy, :manage_users, conn.assigns.current_user, %{}) do
      user = Accounts.get_user!(id)

      with {:ok, updated} <- Accounts.update_user(user, params) do
        json(conn, %{data: preload_profiles(updated)})
      end
    end
  end

  operation(:delete,
    summary: "Delete a user",
    parameters: [id: [in: :path, type: :string, required: true]],
    responses: [
      no_content: "Deleted",
      unauthorized: {"Not an admin", "application/json", @error_schema}
    ]
  )

  def delete(conn, %{"id" => id}) do
    with :ok <- Bodyguard.permit(Policy, :manage_users, conn.assigns.current_user, %{}) do
      user = Accounts.get_user!(id)
      with {:ok, _deleted} <- Accounts.delete_user(user), do: send_resp(conn, :no_content, "")
    end
  end

  operation(:suspend,
    summary: "Suspend a user",
    parameters: [id: [in: :path, type: :string, required: true]],
    responses: [
      ok: {"User", "application/json", %Schema{type: :object, properties: %{data: @user_schema}}},
      unauthorized: {"Not an admin", "application/json", @error_schema}
    ]
  )

  def suspend(conn, %{"id" => id}) do
    with :ok <- Bodyguard.permit(Policy, :suspend_user, conn.assigns.current_user, %{}) do
      user = Accounts.get_user!(id)

      with {:ok, updated} <- Accounts.suspend_user(user) do
        json(conn, %{data: preload_profiles(updated)})
      end
    end
  end

  operation(:activate,
    summary: "Activate (un-suspend) a user",
    parameters: [id: [in: :path, type: :string, required: true]],
    responses: [
      ok: {"User", "application/json", %Schema{type: :object, properties: %{data: @user_schema}}},
      unauthorized: {"Not an admin", "application/json", @error_schema}
    ]
  )

  def activate(conn, %{"id" => id}) do
    with :ok <- Bodyguard.permit(Policy, :suspend_user, conn.assigns.current_user, %{}) do
      user = Accounts.get_user!(id)

      with {:ok, updated} <- Accounts.activate_user(user) do
        json(conn, %{data: preload_profiles(updated)})
      end
    end
  end

  operation(:assign_role,
    summary: "Grant or revoke the admin/superadmin role (epic-02 US-AUTH-11)",
    description: """
    Superadmin-only (`Accounts.Policy` `:assign_role`). Refuses to demote the
    last remaining superadmin. Every change is written to the role audit log
    (`Accounts.list_role_audit_logs/1`).
    """,
    parameters: [id: [in: :path, type: :string, required: true]],
    request_body:
      {"Role", "application/json",
       %Schema{
         type: :object,
         properties: %{role: %Schema{type: :string, enum: ["member", "admin", "superadmin"]}}
       }},
    responses: [
      ok: {"User", "application/json", %Schema{type: :object, properties: %{data: @user_schema}}},
      unauthorized: {"Not a superadmin", "application/json", @error_schema},
      unprocessable_entity: {"Invalid role", "application/json", @error_schema},
      conflict: {"Would leave no active superadmin", "application/json", @error_schema}
    ]
  )

  def assign_role(conn, %{"id" => id, "role" => role_param}) do
    with :ok <- Bodyguard.permit(Policy, :assign_role, conn.assigns.current_user, %{}) do
      user = Accounts.get_user!(id)

      case Accounts.parse_role(role_param) do
        {:ok, role} ->
          case Accounts.assign_role(user, role, conn.assigns.current_user.id) do
            {:ok, updated} ->
              json(conn, %{data: preload_profiles(updated)})

            {:error, :last_superadmin} ->
              conn |> put_status(:conflict) |> json(%{error: "last_superadmin"})

            {:error, changeset} ->
              {:error, changeset}
          end

        :error ->
          conn |> put_status(:unprocessable_entity) |> json(%{error: "invalid_role"})
      end
    end
  end

  defp requested_role(%{"role" => role}) when is_binary(role) do
    case Accounts.parse_role(role) do
      {:ok, role} -> role
      :error -> nil
    end
  end

  defp requested_role(_params), do: nil

  # `:member` is the default role a freshly created account already has —
  # only escalate via `Accounts.assign_role/3` (and its audit trail) when an
  # elevated role was actually requested and authorized above.
  defp maybe_assign_requested_role(user, role, _granter) when role in [nil, :member],
    do: {:ok, user}

  defp maybe_assign_requested_role(user, role, granter),
    do: Accounts.assign_role(user, role, granter.id)

  # `User`'s `@derive {Jason.Encoder, ...}` includes the (has_many) :profiles
  # association, which raises on encode when it's an `Ecto.Association.NotLoaded`
  # struct instead of a list — every render point needs it preloaded first.
  defp preload_profiles(%User{} = user), do: Repo.preload(user, :profiles)
end
