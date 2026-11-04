defmodule RepousseWeb.NurseryController do
  use RepousseWeb, :controller
  use OpenApiSpex.ControllerSpecs
  action_fallback RepousseWeb.FallbackController

  alias Repousse.Accounts
  alias Repousse.CleDesChamps
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

  operation :my_deposits,
    summary: "Trees the current user has deposited at la clé des champs",
    responses: [ok: API.list("Deposits")]

  operation :search_adoptants,
    summary: "Search adoptants by name for a direct gift",
    parameters: [q: [in: :query, type: :string, description: "Name or email", required: false]],
    responses: [ok: API.list("Adoptants")]

  def search_adoptants(conn, params) do
    json(conn, %{data: Accounts.search_adoptants(params["q"] || "")})
  end

  def my_deposits(conn, _params) do
    deposits = conn.assigns.current_user.id |> CleDesChamps.list_for_user() |> Enum.map(&CleDesChamps.present/1)
    json(conn, %{data: deposits})
  end

  operation :add_plant,
    summary: "Add a tree to a nursery, or increase its quantity",
    parameters: [nursery_id: [in: :path, type: :string, description: "Nursery ID"]],
    request_body: {"Plant line", "application/json", %OpenApiSpex.Schema{type: :object}},
    responses: [ok: API.object(Nursery, "Nursery")]

  def add_plant(conn, %{"nursery_id" => nursery_id, "plant" => attrs}) do
    with {:ok, nursery} <- fetch(nursery_id),
         :ok <- Bodyguard.permit(Policy, :manage_nursery, conn.assigns.current_user, %{nursery: nursery}),
         {:ok, _plant} <- CleDesChamps.add_plant(nursery, attrs),
         {:ok, nursery} <- fetch(nursery_id) do
      json(conn, %{data: nursery})
    end
  end

  operation :delete_plant,
    summary: "Remove a tree from a nursery",
    parameters: [
      nursery_id: [in: :path, type: :string, description: "Nursery ID"],
      id: [in: :path, type: :string, description: "Plant ID"]
    ],
    responses: [ok: API.object(Nursery, "Nursery")]

  def delete_plant(conn, %{"nursery_id" => nursery_id, "id" => plant_id}) do
    with {:ok, nursery} <- fetch(nursery_id),
         :ok <- Bodyguard.permit(Policy, :manage_nursery, conn.assigns.current_user, %{nursery: nursery}),
         {:ok, _} <- CleDesChamps.remove_plant(conn.assigns.current_user, nursery, plant_id),
         {:ok, nursery} <- fetch(nursery_id) do
      json(conn, %{data: nursery})
    end
  end

  operation :deposit,
    summary: "Mark a nursery line as deposited at la clé des champs",
    parameters: [
      nursery_id: [in: :path, type: :string, description: "Nursery ID"],
      id: [in: :path, type: :string, description: "Plant ID"]
    ],
    responses: [ok: API.object("Deposit")]

  operation :direct_gift,
    summary: "Give a nursery line directly to an adoptant's planting project",
    parameters: [
      nursery_id: [in: :path, type: :string, description: "Nursery ID"],
      id: [in: :path, type: :string, description: "Plant ID"]
    ],
    request_body: {"Project and quantity", "application/json", %OpenApiSpex.Schema{type: :object}},
    responses: [ok: API.object("Planting")]

  def direct_gift(conn, %{"nursery_id" => nursery_id, "id" => plant_id, "gift" => attrs}) do
    with {:ok, nursery} <- fetch(nursery_id),
         :ok <- Bodyguard.permit(Policy, :manage_nursery, conn.assigns.current_user, %{nursery: nursery}),
         {:ok, planting} <-
           CleDesChamps.direct_gift(
             conn.assigns.current_user,
             nursery,
             plant_id,
             attrs["project_id"],
             attrs["quantity"]
           ) do
      planting = Repousse.Repo.preload(planting, :taxon)
      json(conn, %{data: Repousse.Impact.present_planting(planting)})
    end
  end

  def deposit(conn, %{"nursery_id" => nursery_id, "id" => plant_id}) do
    with {:ok, nursery} <- fetch(nursery_id),
         :ok <- Bodyguard.permit(Policy, :manage_nursery, conn.assigns.current_user, %{nursery: nursery}),
         {:ok, deposit} <- CleDesChamps.deposit_plant(conn.assigns.current_user, nursery, plant_id) do
      json(conn, %{data: CleDesChamps.present(deposit)})
    end
  end

  defp fetch(id) do
    case Nurseries.get_nursery(id) do
      nil -> {:error, :not_found}
      nursery -> {:ok, nursery}
    end
  end
end
