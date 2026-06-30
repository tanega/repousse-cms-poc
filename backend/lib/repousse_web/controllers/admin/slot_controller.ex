defmodule RepousseWeb.Admin.SlotController do
  use RepousseWeb, :controller
  action_fallback RepousseWeb.FallbackController

  alias Repousse.Distributions

  def index(conn, %{"distribution_id" => event_id}) do
    slots = Distributions.list_slots(event_id)
    json(conn, %{data: slots})
  end

  def show(conn, %{"id" => id}) do
    json(conn, %{data: Distributions.get_slot!(id)})
  end

  def create(conn, %{"distribution_id" => event_id, "slot" => params}) do
    with {:ok, slot} <- Distributions.create_slot(Map.put(params, "event_id", event_id)) do
      conn |> put_status(:created) |> json(%{data: slot})
    end
  end

  def update(conn, %{"id" => id, "slot" => params}) do
    slot = Distributions.get_slot!(id)
    with {:ok, updated} <- Distributions.update_slot(slot, params), do: json(conn, %{data: updated})
  end

  def delete(conn, %{"id" => id}) do
    slot = Distributions.get_slot!(id)
    with {:ok, _} <- Repousse.Repo.delete(slot), do: send_resp(conn, :no_content, "")
  end
end
