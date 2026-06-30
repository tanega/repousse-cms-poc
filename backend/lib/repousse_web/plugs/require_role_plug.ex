defmodule RepousseWeb.Plugs.RequireRolePlug do
  import Plug.Conn
  alias Repousse.Accounts

  def init(opts), do: opts

  def call(%{assigns: %{current_user: user}} = conn, role: required_role) do
    if Accounts.has_role?(user, required_role) do
      conn
    else
      conn
      |> put_status(:forbidden)
      |> Phoenix.Controller.json(%{error: "forbidden"})
      |> halt()
    end
  end

  def call(conn, _opts) do
    conn
    |> put_status(:forbidden)
    |> Phoenix.Controller.json(%{error: "forbidden"})
    |> halt()
  end
end
