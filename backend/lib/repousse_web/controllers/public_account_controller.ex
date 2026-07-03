defmodule RepousseWeb.PublicAccountController do
  use RepousseWeb, :controller
  action_fallback RepousseWeb.FallbackController

  alias Repousse.Accounts

  @doc """
  Guest signup entry point for the public distribution form. No auth: this
  is reached by visitors who don't have a session yet. Returns `"existing"`
  instead of creating a duplicate account so the frontend can offer a login
  step instead.
  """
  def create_or_check(conn, %{"email" => email} = params) do
    attrs = Map.take(params, ["first_name", "last_name"])

    case Accounts.find_or_create_guest_by_email(email, attrs) do
      {:created, user} -> json(conn, %{data: %{status: "created", id: user.id, email: user.email}})
      {:existing, user} -> json(conn, %{data: %{status: "existing", id: user.id, email: user.email}})
      error -> error
    end
  end
end
