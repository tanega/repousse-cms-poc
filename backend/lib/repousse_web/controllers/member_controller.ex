defmodule RepousseWeb.MemberController do
  use RepousseWeb, :controller
  use OpenApiSpex.ControllerSpecs
  action_fallback RepousseWeb.FallbackController

  alias Repousse.Accounts
  alias Repousse.Nurseries
  alias RepousseWeb.OpenApiHelpers, as: API

  tags ["Members"]
  security [%{"bearerAuth" => []}]

  operation :show,
    summary: "Get a member's profile page",
    description:
      "Member-facing profile (epic-03). A private profile still resolves, but its " <>
        "nurseries and hosting details are stripped for anyone but the owner and " <>
        "coordinators — `visible` says which of the two the caller got.",
    parameters: [
      id: [in: :path, type: :string, description: "Member ID, or `me` for the current user"]
    ],
    responses: [ok: API.object("Member profile"), not_found: API.object("Member not found")]

  def show(conn, %{"id" => id}) do
    viewer = conn.assigns.current_user

    with {:ok, owner} <- fetch(id, viewer) do
      visible? = Nurseries.visible_to?(owner, viewer)
      profiles = Accounts.list_profiles(owner)

      json(conn, %{
        data: %{
          user: public_user(owner),
          visible: visible?,
          profiles: if(visible?, do: profiles, else: Enum.map(profiles, &strip_hosting/1)),
          nurseries: if(visible?, do: Nurseries.list_user_nurseries(owner.id), else: [])
        }
      })
    end
  end

  defp fetch("me", viewer), do: {:ok, viewer}

  defp fetch(id, _viewer) do
    case Accounts.get_user(id) do
      nil -> {:error, :not_found}
      user -> {:ok, user}
    end
  end

  # Never expose a member's email or account moderation state to another
  # member — those stay on the admin endpoints.
  defp public_user(user) do
    Map.take(user, [
      :id,
      :first_name,
      :last_name,
      :avatar_url,
      :profile_visibility,
      :inserted_at
    ])
  end

  defp strip_hosting(profile) do
    %{profile | hosting_address: nil, hosting_lat: nil, hosting_lng: nil, hosted_species: []}
  end
end
