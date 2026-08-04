defmodule RepousseWeb.AccountsController do
  use RepousseWeb, :controller
  use OpenApiSpex.ControllerSpecs
  action_fallback RepousseWeb.FallbackController

  alias Repousse.Accounts
  alias RepousseWeb.OpenApiHelpers, as: API
  alias RepousseWeb.Schemas.{User, UserProfile}

  tags ["Account"]
  security [%{"bearerAuth" => []}]

  operation :me,
    summary: "Get the current user",
    responses: [ok: API.object(User, "Current user")]

  def me(conn, _params) do
    user = conn.assigns.current_user |> Repousse.Repo.preload(:profiles)
    json(conn, %{data: user})
  end

  operation :update_me,
    summary: "Update the current user",
    request_body: {"User attributes", "application/json", %OpenApiSpex.Schema{type: :object}},
    responses: [ok: API.object(User, "Updated user")]

  def update_me(conn, %{"user" => params}) do
    user = conn.assigns.current_user

    with {:ok, updated} <- Accounts.update_own_profile(user, params) do
      json(conn, %{data: Repousse.Repo.preload(updated, :profiles)})
    end
  end

  operation :update_avatar,
    summary: "Upload the current user's avatar",
    request_body:
      {"Avatar image (multipart)", "multipart/form-data", %OpenApiSpex.Schema{
         type: :object,
         properties: %{avatar: %OpenApiSpex.Schema{type: :string, format: :binary}}
       }},
    responses: [ok: API.object(User, "Updated user")]

  def update_avatar(conn, %{"avatar" => %Plug.Upload{} = upload}) do
    user = conn.assigns.current_user

    with {:ok, avatar_url} <- Repousse.Storage.upload_avatar(upload, user.id),
         {:ok, updated} <- Accounts.update_avatar(user, avatar_url) do
      json(conn, %{data: Repousse.Repo.preload(updated, :profiles)})
    end
  end

  def update_avatar(_conn, _params), do: {:error, "Fichier `avatar` manquant"}

  operation :profiles,
    summary: "List the current user's profiles",
    responses: [ok: API.list(UserProfile, "Current user's profiles")]

  def profiles(conn, _params) do
    user = conn.assigns.current_user |> Repousse.Repo.preload(:profiles)
    json(conn, %{data: user.profiles})
  end

  operation :update_profiles,
    summary: "Update the current user's profiles",
    request_body: {"Profiles", "application/json", %OpenApiSpex.Schema{type: :object}},
    responses: [ok: API.list(UserProfile, "Updated profiles")]

  def update_profiles(conn, %{"profiles" => _params}) do
    # placeholder — profile update logic
    json(conn, %{data: []})
  end
end
