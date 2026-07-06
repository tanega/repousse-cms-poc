defmodule RepousseWeb.DistributionController do
  use RepousseWeb, :controller
  use OpenApiSpex.ControllerSpecs
  action_fallback RepousseWeb.FallbackController

  alias Repousse.Distributions
  alias RepousseWeb.OpenApiHelpers, as: API
  alias RepousseWeb.Schemas.Event

  tags ["Distributions"]
  security [%{"bearerAuth" => []}]

  operation :index,
    summary: "List distribution events",
    responses: [ok: API.list(Event, "Distribution events")]

  def index(conn, _params) do
    events = Distributions.list_events()
    json(conn, %{data: events})
  end

  operation :show,
    summary: "Get a distribution event",
    parameters: [id: [in: :path, type: :string, description: "Event ID"]],
    responses: [ok: API.object(Event, "Distribution event")]

  def show(conn, %{"id" => id}) do
    event = Distributions.get_event!(id)
    json(conn, %{data: event})
  end

  operation :create,
    summary: "Create a distribution event",
    request_body: {"Event attributes", "application/json", %OpenApiSpex.Schema{type: :object}},
    responses: [created: API.object(Event, "Created event")]

  def create(conn, %{"event" => params}) do
    with {:ok, event} <- Distributions.create_event(params) do
      conn |> put_status(:created) |> json(%{data: event})
    end
  end

  operation :update,
    summary: "Update a distribution event",
    parameters: [id: [in: :path, type: :string, description: "Event ID"]],
    request_body: {"Event attributes", "application/json", %OpenApiSpex.Schema{type: :object}},
    responses: [ok: API.object(Event, "Updated event")]

  def update(conn, %{"id" => id, "event" => params}) do
    event = Distributions.get_event!(id)

    with {:ok, updated} <- Distributions.update_event(event, params) do
      json(conn, %{data: updated})
    end
  end

  operation :publish,
    summary: "Publish a distribution event",
    parameters: [id: [in: :path, type: :string, description: "Event ID"]],
    responses: [ok: API.object(Event, "Published event")]

  def publish(conn, %{"id" => id}) do
    event = Distributions.get_event!(id)

    with {:ok, %{event: published}} <- Distributions.publish_event(event) do
      json(conn, %{data: published})
    end
  end

  operation :close,
    summary: "Close a distribution event",
    parameters: [id: [in: :path, type: :string, description: "Event ID"]],
    responses: [ok: API.object(Event, "Closed event")]

  def close(conn, %{"id" => id}) do
    event = Distributions.get_event!(id)

    with {:ok, closed} <- Distributions.close_event(event) do
      json(conn, %{data: closed})
    end
  end
end
