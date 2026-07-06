defmodule RepousseWeb.Admin.DistributionController do
  use RepousseWeb, :controller
  use OpenApiSpex.ControllerSpecs
  action_fallback RepousseWeb.FallbackController

  alias Repousse.Distributions
  alias RepousseWeb.OpenApiHelpers, as: API
  alias RepousseWeb.Schemas.{Event, Reservation}

  tags ["Admin — Distributions"]
  security [%{"bearerAuth" => []}]

  operation :index,
    summary: "List distribution events (admin)",
    responses: [ok: API.list(Event, "Distribution events")]

  def index(conn, _params), do: json(conn, %{data: Distributions.list_events()})

  operation :show,
    summary: "Get a distribution event (admin)",
    parameters: [id: [in: :path, type: :string, description: "Event ID"]],
    responses: [ok: API.object(Event, "Distribution event")]

  def show(conn, %{"id" => id}), do: json(conn, %{data: Distributions.get_event!(id)})

  operation :create,
    summary: "Create a distribution event (admin)",
    request_body: {"Event attributes", "application/json", %OpenApiSpex.Schema{type: :object}},
    responses: [created: API.object(Event, "Created event")]

  def create(conn, %{"distribution" => params}) do
    with {:ok, event} <- Distributions.create_event(params) do
      conn |> put_status(:created) |> json(%{data: event})
    end
  end

  operation :update,
    summary: "Update a distribution event (admin)",
    parameters: [id: [in: :path, type: :string, description: "Event ID"]],
    request_body: {"Event attributes", "application/json", %OpenApiSpex.Schema{type: :object}},
    responses: [ok: API.object(Event, "Updated event")]

  def update(conn, %{"id" => id, "distribution" => params}) do
    event = Distributions.get_event!(id)
    with {:ok, updated} <- Distributions.update_event(event, params), do: json(conn, %{data: updated})
  end

  operation :delete,
    summary: "Delete a distribution event (admin)",
    parameters: [id: [in: :path, type: :string, description: "Event ID"]],
    responses: [no_content: API.no_content()]

  def delete(conn, %{"id" => id}) do
    event = Distributions.get_event!(id)
    with {:ok, _} <- Repousse.Repo.delete(event), do: send_resp(conn, :no_content, "")
  end

  operation :publish,
    summary: "Publish a distribution event (admin)",
    parameters: [id: [in: :path, type: :string, description: "Event ID"]],
    responses: [ok: API.object(Event, "Published event")]

  def publish(conn, %{"id" => id}) do
    event = Distributions.get_event!(id)
    with {:ok, %{event: published}} <- Distributions.publish_event(event), do: json(conn, %{data: published})
  end

  operation :close,
    summary: "Close a distribution event (admin)",
    parameters: [id: [in: :path, type: :string, description: "Event ID"]],
    responses: [ok: API.object(Event, "Closed event")]

  def close(conn, %{"id" => id}) do
    event = Distributions.get_event!(id)
    with {:ok, updated} <- Distributions.close_event(event), do: json(conn, %{data: updated})
  end

  operation :attendees,
    summary: "List attendees (reservations) for a distribution event (admin)",
    parameters: [distribution_id: [in: :path, type: :string, description: "Event ID"]],
    responses: [ok: API.list(Reservation, "Reservations")]

  def attendees(conn, %{"distribution_id" => id}) do
    reservations = Distributions.list_reservations_for_event(id)
    json(conn, %{data: reservations})
  end
end
