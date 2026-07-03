defmodule RepousseWeb.Admin.UserController do
  use RepousseWeb, :controller
  action_fallback RepousseWeb.FallbackController

  alias Repousse.{Accounts, Repo}
  alias Repousse.Accounts.User
  import Ecto.Query

  def index(conn, _params) do
    users = Repo.all(from u in User, order_by: [desc: u.inserted_at])
    json(conn, %{data: users})
  end

  def show(conn, %{"id" => id}) do
    user = Accounts.get_user!(id)
    json(conn, %{data: user})
  end

  def create(conn, %{"user" => params}) do
    with {:ok, user} <- Accounts.create_user_with_hanko(params, is_verified: true) do
      conn |> put_status(:created) |> json(%{data: user})
    end
  end

  def update(conn, %{"id" => id, "user" => params}) do
    user = Accounts.get_user!(id)
    with {:ok, updated} <- Accounts.update_user(user, params), do: json(conn, %{data: updated})
  end

  def delete(conn, %{"id" => id}) do
    user = Accounts.get_user!(id)
    with {:ok, _deleted} <- Accounts.delete_user(user), do: send_resp(conn, :no_content, "")
  end

  def suspend(conn, %{"id" => id}) do
    user = Accounts.get_user!(id)
    with {:ok, updated} <- Accounts.suspend_user(user), do: json(conn, %{data: updated})
  end

  def activate(conn, %{"id" => id}) do
    user = Accounts.get_user!(id)
    with {:ok, updated} <- Accounts.activate_user(user), do: json(conn, %{data: updated})
  end
end
