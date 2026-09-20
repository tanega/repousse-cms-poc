defmodule RepousseWeb.NurseryController do
  use RepousseWeb, :controller
  use OpenApiSpex.ControllerSpecs
  action_fallback RepousseWeb.FallbackController

  alias Repousse.Nurseries
  alias Repousse.Nurseries.Policy
  alias RepousseWeb.OpenApiHelpers, as: API
  alias RepousseWeb.Schemas.Nursery

  tags ["Nurseries"]
  security [%{"bearerAuth" => []}]

  operation :mine,
    summary: "List the current user's nurseries",
    responses: [ok: API.list(Nursery, "Own nurseries")]

  def mine(conn, _params) do
    json(conn, %{data: Nurseries.list_user_nurseries(conn.assigns.current_user.id)})
  end

  operation :create,
    summary: "Create a nursery",
    description:
      "Requires the `host_family` engagement profile. `plants` is a full list of " <>
        "`{taxon_id, quantity, note}` lines and replaces whatever was there.",
    request_body: {"Nursery attributes", "application/json", %OpenApiSpex.Schema{type: :object}},
    responses: [created: API.object(Nursery, "Created nursery")]

  def create(conn, %{"nursery" => attrs}) do
    with {:ok, nursery} <- Nurseries.create_nursery(conn.assigns.current_user, attrs) do
      conn |> put_status(:created) |> json(%{data: nursery})
    end
  end

  operation :update,
    summary: "Update a nursery",
    parameters: [id: [in: :path, type: :string, description: "Nursery ID"]],
    request_body: {"Nursery attributes", "application/json", %OpenApiSpex.Schema{type: :object}},
    responses: [ok: API.object(Nursery, "Updated nursery")]

  def update(conn, %{"id" => id, "nursery" => attrs}) do
    with {:ok, nursery} <- fetch(id),
         :ok <-
           Bodyguard.permit(Policy, :manage_nursery, conn.assigns.current_user, %{
             nursery: nursery
           }),
         {:ok, updated} <- Nurseries.update_nursery(nursery, attrs) do
      json(conn, %{data: updated})
    end
  end

  operation :archive,
    summary: "Archive a nursery",
    parameters: [id: [in: :path, type: :string, description: "Nursery ID"]],
    responses: [ok: API.object(Nursery, "Archived nursery")]

  def archive(conn, %{"id" => id}) do
    with {:ok, nursery} <- fetch(id),
         :ok <-
           Bodyguard.permit(Policy, :manage_nursery, conn.assigns.current_user, %{
             nursery: nursery
           }),
         {:ok, archived} <- Nurseries.archive_nursery(nursery) do
      json(conn, %{data: archived})
    end
  end

  defp fetch(id) do
    case Nurseries.get_nursery(id) do
      nil -> {:error, :not_found}
      nursery -> {:ok, nursery}
    end
  end
end
