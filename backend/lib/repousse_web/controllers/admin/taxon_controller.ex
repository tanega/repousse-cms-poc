defmodule RepousseWeb.Admin.TaxonController do
  use RepousseWeb, :controller
  action_fallback RepousseWeb.FallbackController

  alias Repousse.Taxa

  def index(conn, %{"q" => q}), do: json(conn, %{data: Taxa.search_taxa(q)})
  def index(conn, _params), do: json(conn, %{data: Taxa.list_taxa()})
  def show(conn, %{"id" => id}), do: json(conn, %{data: Taxa.get_taxon!(id)})

  def create(conn, %{"taxon" => params}) do
    with {:ok, taxon} <- Taxa.create_taxon(params) do
      conn |> put_status(:created) |> json(%{data: taxon})
    end
  end

  def update(conn, %{"id" => id, "taxon" => params}) do
    taxon = Taxa.get_taxon!(id)
    user = conn.assigns.current_user
    with {:ok, updated} <- Taxa.update_taxon(taxon, params, user), do: json(conn, %{data: updated})
  end

  def delete(conn, %{"id" => id}) do
    taxon = Taxa.get_taxon!(id)
    with {:ok, _} <- Taxa.delete_taxon(taxon), do: send_resp(conn, :no_content, "")
  end

  def versions(conn, %{"id" => id}) do
    versions = Taxa.list_taxon_versions(id)
    json(conn, %{data: versions})
  end

  def restore(conn, %{"version_id" => version_id}) do
    version = Repousse.Repo.get!(Repousse.Taxa.TaxonVersion, version_id)
    user = conn.assigns.current_user

    with {:ok, restored} <- Taxa.restore_version(version, user), do: json(conn, %{data: restored})
  end
end
