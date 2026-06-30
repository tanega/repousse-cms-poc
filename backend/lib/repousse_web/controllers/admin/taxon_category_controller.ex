defmodule RepousseWeb.Admin.TaxonCategoryController do
  use RepousseWeb, :controller
  action_fallback RepousseWeb.FallbackController

  alias Repousse.Taxa

  def index(conn, _params), do: json(conn, %{data: Taxa.list_taxon_categories()})

  def create(conn, %{"taxon_category" => params}) do
    with {:ok, category} <- Taxa.create_taxon_category(params) do
      conn |> put_status(:created) |> json(%{data: category})
    end
  end

  def update(conn, %{"id" => id, "taxon_category" => params}) do
    category = Taxa.get_taxon_category!(id)
    with {:ok, updated} <- Taxa.update_taxon_category(category, params), do: json(conn, %{data: updated})
  end

  def delete(conn, %{"id" => id}) do
    category = Taxa.get_taxon_category!(id)
    with {:ok, _} <- Repousse.Repo.delete(category), do: send_resp(conn, :no_content, "")
  end
end
