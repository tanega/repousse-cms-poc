defmodule RepousseWeb.PublicAccountController do
  use RepousseWeb, :controller
  use OpenApiSpex.ControllerSpecs
  action_fallback RepousseWeb.FallbackController

  alias OpenApiSpex.Schema
  alias Repousse.Accounts

  tags(["public"])

  operation(:create_or_check,
    summary: "Guest signup / lookup from the public distribution form",
    description: """
    No auth — reached by visitors without a session. Creates the account
    (Postgres + Hanko) if the email is new, otherwise returns the existing
    account so the frontend can offer a login step instead of a duplicate
    signup.
    """,
    request_body:
      {"Guest account params", "application/json",
       %Schema{
         type: :object,
         properties: %{
           email: %Schema{type: :string},
           first_name: %Schema{type: :string},
           last_name: %Schema{type: :string}
         },
         required: [:email]
       }},
    responses: [
      ok: {"Guest account status", "application/json", %Schema{type: :object}}
    ]
  )

  @doc """
  Guest signup entry point for the public distribution form. No auth: this
  is reached by visitors who don't have a session yet. Returns `"existing"`
  instead of creating a duplicate account so the frontend can offer a login
  step instead.
  """
  def create_or_check(conn, %{"email" => email} = params) do
    attrs = Map.take(params, ["first_name", "last_name"])

    case Accounts.find_or_create_guest_by_email(email, attrs) do
      {:created, user} ->
        json(conn, %{data: %{status: "created", id: user.id, email: user.email}})

      {:existing, user} ->
        json(conn, %{data: %{status: "existing", id: user.id, email: user.email}})

      error ->
        error
    end
  end
end
