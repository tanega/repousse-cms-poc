defmodule RepousseWeb.TaxonController do
  use RepousseWeb, :controller
  action_fallback RepousseWeb.FallbackController

  alias Repousse.Taxa

  def index(conn, %{"q" => q}) do
    taxa = Taxa.search_taxa(q)
    json(conn, %{data: taxa})
  end

  def index(conn, _params) do
    taxa = Taxa.list_taxa()
    json(conn, %{data: taxa})
  end

  def show(conn, %{"id" => id}) do
    taxon = Taxa.get_taxon!(id)
    json(conn, %{data: taxon})
  end

  def create(conn, %{"taxon" => params}) do
    with {:ok, taxon} <- Taxa.create_taxon(params) do
      conn |> put_status(:created) |> json(%{data: taxon})
    end
  end

  def update(conn, %{"id" => id, "taxon" => params}) do
    taxon = Taxa.get_taxon!(id)
    user = conn.assigns.current_user

    with {:ok, updated} <- Taxa.update_taxon(taxon, params, user) do
      json(conn, %{data: updated})
    end
  end

  def delete(conn, %{"id" => id}) do
    taxon = Taxa.get_taxon!(id)

    with {:ok, _} <- Taxa.delete_taxon(taxon) do
      send_resp(conn, :no_content, "")
    end
  end
end
