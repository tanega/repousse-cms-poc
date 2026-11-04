defmodule RepousseWeb.Admin.ImpactController do
  use RepousseWeb, :controller
  use OpenApiSpex.ControllerSpecs
  action_fallback RepousseWeb.FallbackController

  alias Repousse.Impact
  alias RepousseWeb.OpenApiHelpers, as: API

  tags ["Admin — Impact"]
  security [%{"bearerAuth" => []}]

  operation :show,
    summary: "Impact totals: trees given, hedges, survival rate",
    responses: [ok: API.object("Impact summary")]

  def show(conn, _params) do
    json(conn, %{data: Impact.summary(), gifts: Enum.map(Impact.list_gifts(), &Impact.present_planting/1), hedges: Enum.map(Impact.list_hedges(), &Impact.present_hedge/1)})
  end

  operation :create_gift,
    summary: "Record trees already given, outside a current distribution",
    request_body: {"Gift", "application/json", %OpenApiSpex.Schema{type: :object}},
    responses: [created: API.object("Planting")]

  def create_gift(conn, %{"gift" => attrs}) do
    with {:ok, planting} <- Impact.create_gift(attrs, conn.assigns.current_user) do
      conn |> put_status(:created) |> json(%{data: Impact.present_planting(planting)})
    end
  end

  operation :create_hedge,
    summary: "Record a planted hedge and its survival rate",
    request_body: {"Hedge", "application/json", %OpenApiSpex.Schema{type: :object}},
    responses: [created: API.object("Hedge")]

  def create_hedge(conn, %{"hedge" => attrs}) do
    with {:ok, hedge} <- Impact.create_hedge(attrs) do
      conn |> put_status(:created) |> json(%{data: Impact.present_hedge(hedge)})
    end
  end
end
