defmodule RepousseWeb.Admin.DistributionController do
  use RepousseWeb, :controller
  action_fallback RepousseWeb.FallbackController

  alias Repousse.Distributions

  def index(conn, _params), do: json(conn, %{data: Distributions.list_events()})

  def show(conn, %{"id" => id}), do: json(conn, %{data: Distributions.get_event!(id)})

  def create(conn, %{"distribution" => params}) do
    with {:ok, event} <- Distributions.create_event(params) do
      conn |> put_status(:created) |> json(%{data: event})
    end
  end

  def update(conn, %{"id" => id, "distribution" => params}) do
    event = Distributions.get_event!(id)
    with {:ok, updated} <- Distributions.update_event(event, params), do: json(conn, %{data: updated})
  end

  def delete(conn, %{"id" => id}) do
    event = Distributions.get_event!(id)
    with {:ok, _} <- Repousse.Repo.delete(event), do: send_resp(conn, :no_content, "")
  end

  def publish(conn, %{"id" => id}) do
    event = Distributions.get_event!(id)
    with {:ok, updated} <- Distributions.publish_event(event), do: json(conn, %{data: updated})
  end

  def close(conn, %{"id" => id}) do
    event = Distributions.get_event!(id)
    with {:ok, updated} <- Distributions.close_event(event), do: json(conn, %{data: updated})
  end

  def attendees(conn, %{"distribution_id" => id}) do
    reservations = Distributions.list_reservations_for_event(id)
    json(conn, %{data: reservations})
  end
end
