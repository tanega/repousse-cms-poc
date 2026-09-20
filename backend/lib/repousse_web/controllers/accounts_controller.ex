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
    json(conn, %{data: Accounts.preload_profiles(conn.assigns.current_user)})
  end

  operation :update_me,
    summary: "Update the current user",
    request_body: {"User attributes", "application/json", %OpenApiSpex.Schema{type: :object}},
    responses: [ok: API.object(User, "Updated user")]

  def update_me(conn, %{"user" => params}) do
    user = conn.assigns.current_user

    with {:ok, updated} <- Accounts.update_own_profile(user, params) do
      json(conn, %{data: Accounts.preload_profiles(updated)})
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
      json(conn, %{data: Accounts.preload_profiles(updated)})
    end
  end

  def update_avatar(_conn, _params), do: {:error, "Fichier `avatar` manquant"}

  operation :update_visibility,
    summary: "Set whether the current user's profile is public or private",
    description:
      "Drives who can see the member's profile page and nurseries: `public` = every " <>
        "member, `private` = coordinators only (epic-03).",
    request_body:
      {"Visibility", "application/json", %OpenApiSpex.Schema{
         type: :object,
         properties: %{
           profile_visibility: %OpenApiSpex.Schema{type: :string, enum: ["public", "private"]}
         }
       }},
    responses: [ok: API.object(User, "Updated user")]

  def update_visibility(conn, %{"profile_visibility" => visibility}) do
    with {:ok, updated} <- Accounts.set_profile_visibility(conn.assigns.current_user, visibility) do
      json(conn, %{data: Accounts.preload_profiles(updated)})
    end
  end

  operation :profiles,
    summary: "List the current user's profiles",
    responses: [ok: API.list(UserProfile, "Current user's profiles")]

  def profiles(conn, _params) do
    json(conn, %{data: Accounts.list_profiles(conn.assigns.current_user)})
  end

  operation :update_profiles,
    summary: "Replace the current user's engagement profiles",
    description:
      "Full replace (epic-03 US-PROFIL-04): send every profile that should be active. " <>
        "At least one is required, and `host_family` can't be dropped while the member " <>
        "still has active nurseries.",
    request_body:
      {"Active profile types", "application/json", %OpenApiSpex.Schema{
         type: :object,
         properties: %{
           profiles: %OpenApiSpex.Schema{
             type: :array,
             items: %OpenApiSpex.Schema{
               type: :string,
               enum: ["volunteer", "adoptant", "host_family"]
             }
           }
         }
       }},
    responses: [ok: API.list(UserProfile, "Updated profiles")]

  def update_profiles(conn, %{"profiles" => types}) when is_list(types) do
    with {:ok, profiles} <- Accounts.set_profiles(conn.assigns.current_user, types) do
      json(conn, %{data: profiles})
    end
  end

  def update_profiles(_conn, _params), do: {:error, "`profiles` doit être une liste"}

  operation :update_profile_details,
    summary: "Update the fields specific to one engagement profile",
    description:
      "In practice the Famille d'accueil hosting details (epic-03 US-PROFIL-06): capacity, " <>
        "surface, address, availability, equipment and hostable species.",
    parameters: [
      profile_type: [in: :path, type: :string, description: "Profile type", example: "host_family"]
    ],
    request_body: {"Profile attributes", "application/json", %OpenApiSpex.Schema{type: :object}},
    responses: [ok: API.object(UserProfile, "Updated profile")]

  def update_profile_details(conn, %{"profile_type" => profile_type, "profile" => attrs}) do
    with {:ok, profile} <-
           Accounts.update_profile_details(conn.assigns.current_user, profile_type, attrs) do
      json(conn, %{data: Repousse.Repo.preload(profile, :hosted_species, force: true)})
    end
  end
end
