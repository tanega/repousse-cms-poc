defmodule RepousseWeb.DistributionController do
  use RepousseWeb, :controller
  action_fallback RepousseWeb.FallbackController

  alias Repousse.Distributions

  def index(conn, _params) do
    events = Distributions.list_events()
    json(conn, %{data: events})
  end

  def show(conn, %{"id" => id}) do
    event = Distributions.get_event!(id)
    json(conn, %{data: event})
  end

  def create(conn, %{"event" => params}) do
    with {:ok, event} <- Distributions.create_event(params) do
      conn |> put_status(:created) |> json(%{data: event})
    end
  end

  def update(conn, %{"id" => id, "event" => params}) do
    event = Distributions.get_event!(id)

    with {:ok, updated} <- Distributions.update_event(event, params) do
      json(conn, %{data: updated})
    end
  end

  def publish(conn, %{"id" => id}) do
    event = Distributions.get_event!(id)

    with {:ok, published} <- Distributions.publish_event(event) do
      json(conn, %{data: published})
    end
  end

  def close(conn, %{"id" => id}) do
    event = Distributions.get_event!(id)

    with {:ok, closed} <- Distributions.close_event(event) do
      json(conn, %{data: closed})
    end
  end
end
