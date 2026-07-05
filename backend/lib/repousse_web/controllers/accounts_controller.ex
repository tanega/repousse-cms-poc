defmodule RepousseWeb.AccountsController do
  use RepousseWeb, :controller
  use OpenApiSpex.ControllerSpecs
  action_fallback RepousseWeb.FallbackController

  alias OpenApiSpex.Schema
  alias Repousse.Accounts

  tags(["me"])
  security([%{"bearerAuth" => []}])

  @error_schema %Schema{type: :object, properties: %{error: %Schema{type: :string}}}

  operation(:me,
    summary: "Show the current user",
    responses: [ok: {"User", "application/json", %Schema{type: :object}}]
  )

  def me(conn, _params) do
    user = conn.assigns.current_user |> Repousse.Repo.preload(:profiles)
    json(conn, %{data: user})
  end

  operation(:update_me,
    summary: "Update the current user's own account fields",
    request_body: {"User params", "application/json", %Schema{type: :object}},
    responses: [ok: {"User", "application/json", %Schema{type: :object}}]
  )

  def update_me(conn, %{"user" => params}) do
    user = conn.assigns.current_user

    with {:ok, updated} <- Accounts.update_user(user, params) do
      json(conn, %{data: updated})
    end
  end

  operation(:profiles,
    summary: "List the current user's active profiles",
    responses: [ok: {"Profiles", "application/json", %Schema{type: :object}}]
  )

  def profiles(conn, _params) do
    user = conn.assigns.current_user |> Repousse.Repo.preload(:profiles)
    json(conn, %{data: user.profiles})
  end

  operation(:update_profiles,
    summary: "Select the current user's profile(s) (epic-02 US-AUTH-09 / epic-03 US-PROFIL-04)",
    description: """
    Replaces the user's active profile set. Only the three self-selectable
    profiles are accepted (`volunteer`, `adoptant`, `host_family`) — the
    `Administrateur` persona is a platform `role`, granted by a superadmin,
    never self-selected here. At least one profile is always required.
    """,
    request_body:
      {"Profiles", "application/json",
       %Schema{
         type: :object,
         properties: %{profiles: %Schema{type: :array, items: %Schema{type: :string}}}
       }},
    responses: [
      ok: {"Profiles", "application/json", %Schema{type: :object}},
      unprocessable_entity: {"Invalid selection", "application/json", @error_schema}
    ]
  )

  def update_profiles(conn, %{"profiles" => profiles}) when is_list(profiles) do
    user = conn.assigns.current_user

    case Accounts.set_profiles(user, profiles) do
      {:ok, updated_profiles} ->
        json(conn, %{data: updated_profiles})

      {:error, :at_least_one_profile_required} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{error: "at_least_one_profile_required"})

      {:error, :invalid_profile_type} ->
        conn |> put_status(:unprocessable_entity) |> json(%{error: "invalid_profile_type"})

      {:error, changeset} ->
        {:error, changeset}
    end
  end
end
