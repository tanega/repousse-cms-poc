defmodule RepousseWeb.Admin.CleDesChampsController do
  use RepousseWeb, :controller
  use OpenApiSpex.ControllerSpecs
  action_fallback RepousseWeb.FallbackController

  alias Repousse.CleDesChamps
  alias Repousse.Distributions
  alias RepousseWeb.OpenApiHelpers, as: API

  tags ["Admin — Clé des champs"]
  security [%{"bearerAuth" => []}]

  operation :index,
    summary: "Trees deposited by host families and not yet assigned to a distribution",
    responses: [ok: API.list("Available deposits")]

  def index(conn, _params) do
    json(conn, %{
      data: CleDesChamps.list_available() |> Enum.map(&CleDesChamps.present/1),
      archive: CleDesChamps.list_archive() |> Enum.map(&CleDesChamps.present/1)
    })
  end

  operation :create,
    summary: "Add trees that arrived directly at la clé des champs",
    request_body: {"Deposit", "application/json", %OpenApiSpex.Schema{type: :object}},
    responses: [created: API.object("Deposit")]

  def create(conn, %{"deposit" => attrs}) do
    with {:ok, deposit} <- CleDesChamps.add_direct(conn.assigns.current_user, attrs) do
      conn |> put_status(:created) |> json(%{data: CleDesChamps.present(deposit)})
    end
  end

  operation :update,
    summary: "Correct the quantity of a deposit that is not yet in a distribution",
    parameters: [id: [in: :path, type: :string, description: "Deposit ID"]],
    request_body: {"Quantity", "application/json", %OpenApiSpex.Schema{type: :object}},
    responses: [ok: API.object("Deposit")]

  def update(conn, %{"id" => id, "deposit" => attrs}) do
    with %CleDesChamps.Deposit{} = deposit <- Repousse.Repo.get(CleDesChamps.Deposit, id),
         {:ok, updated} <- CleDesChamps.update_quantity(deposit, attrs["quantity"]) do
      json(conn, %{data: CleDesChamps.present(Repousse.Repo.preload(updated, [:taxon, :user, :nursery]))})
    else
      nil -> {:error, :not_found}
      other -> other
    end
  end

  operation :delete,
    summary: "Remove a deposit that is not yet in a distribution",
    parameters: [id: [in: :path, type: :string, description: "Deposit ID"]],
    responses: [no_content: API.no_content()]

  def delete(conn, %{"id" => id}) do
    case Repousse.Repo.get(CleDesChamps.Deposit, id) do
      nil ->
        {:error, :not_found}

      deposit ->
        with {:ok, _} <- CleDesChamps.remove_deposit(deposit) do
          send_resp(conn, :no_content, "")
        end
    end
  end

  operation :allocate,
    summary: "Pour deposited trees into a distribution's stock",
    parameters: [distribution_id: [in: :path, type: :string, description: "Event ID"]],
    request_body: {"Deposit ids, or all available when omitted", "application/json", %OpenApiSpex.Schema{type: :object}},
    responses: [ok: API.list("Updated stocks")]

  def allocate(conn, %{"distribution_id" => event_id} = params) do
    ids =
      case params["deposit_ids"] do
        list when is_list(list) and list != [] -> list
        _ -> CleDesChamps.list_available() |> Enum.map(& &1.id)
      end

    with {:ok, _stocks} <- CleDesChamps.allocate_to_event(event_id, ids) do
      json(conn, %{data: Distributions.list_stocks(event_id)})
    end
  end
end
