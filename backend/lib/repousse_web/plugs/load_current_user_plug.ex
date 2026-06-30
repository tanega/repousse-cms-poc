defmodule RepousseWeb.Plugs.LoadCurrentUserPlug do
  @moduledoc """
  Loads the current user from DB using the hanko_id from JWT claims.
  Assigns :current_user to conn. Creates user on first login.
  """
  import Plug.Conn
  alias Repousse.Accounts

  def init(opts), do: opts

  def call(%{assigns: %{hanko_claims: %{"sub" => hanko_id, "email" => email}}} = conn, _opts) do
    user = Accounts.find_or_create_by_hanko_id!(hanko_id, email)
    assign(conn, :current_user, user)
  end

  def call(%{assigns: %{hanko_claims: %{"sub" => hanko_id}}} = conn, _opts) do
    case Accounts.get_user_by_hanko_id(hanko_id) do
      nil ->
        conn
        |> put_status(:unauthorized)
        |> Phoenix.Controller.json(%{error: "user_not_found"})
        |> halt()

      user ->
        assign(conn, :current_user, user)
    end
  end

  def call(conn, _opts), do: conn
end
