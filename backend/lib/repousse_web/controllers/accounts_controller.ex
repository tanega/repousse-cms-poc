defmodule RepousseWeb.AccountsController do
  use RepousseWeb, :controller
  action_fallback RepousseWeb.FallbackController

  alias Repousse.Accounts

  def me(conn, _params) do
    user = conn.assigns.current_user |> Repousse.Repo.preload(:profiles)
    json(conn, %{data: user})
  end

  def update_me(conn, %{"user" => params}) do
    user = conn.assigns.current_user

    with {:ok, updated} <- Accounts.update_user(user, params) do
      json(conn, %{data: updated})
    end
  end

  def profiles(conn, _params) do
    user = conn.assigns.current_user |> Repousse.Repo.preload(:profiles)
    json(conn, %{data: user.profiles})
  end

  def update_profiles(conn, %{"profiles" => _params}) do
    # placeholder — profile update logic
    json(conn, %{data: []})
  end
end
