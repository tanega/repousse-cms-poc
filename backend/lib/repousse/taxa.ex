defmodule Repousse.Taxa do
  import Ecto.Query
  alias Repousse.Repo
  alias Repousse.Taxa.{Taxon, TaxonCategory, TaxonExternalLink, TaxonVersion}

  # ── Categories ────────────────────────────────────────────────────────────

  def list_categories, do: Repo.all(TaxonCategory)
  def list_taxon_categories, do: list_categories()
  def get_category!(id), do: Repo.get!(TaxonCategory, id)
  def get_taxon_category!(id), do: get_category!(id)
  def create_category(attrs), do: %TaxonCategory{} |> TaxonCategory.changeset(attrs) |> Repo.insert()
  def create_taxon_category(attrs), do: create_category(attrs)
  def update_category(%TaxonCategory{} = cat, attrs), do: cat |> TaxonCategory.changeset(attrs) |> Repo.update()
  def update_taxon_category(%TaxonCategory{} = cat, attrs), do: update_category(cat, attrs)
  def delete_category(%TaxonCategory{} = cat), do: Repo.delete(cat)

  # ── Taxa ──────────────────────────────────────────────────────────────────

  def list_taxa(opts \\ []) do
    Taxon
    |> maybe_filter_category(opts[:category_id])
    |> maybe_filter_level(opts[:level])
    |> maybe_search(opts[:search])
    |> preload([:category, :parent])
    |> Repo.all()
  end

  def get_taxon(id), do: Repo.get(Taxon, id)
  def get_taxon!(id), do: Repo.get!(Taxon, id)

  def get_taxon_with_tree(id) do
    Repo.get!(Taxon, id)
    |> Repo.preload([:parent, :children, :category, :external_links])
  end

  def search_taxa(term), do: list_taxa(search: term)

  def create_taxon(attrs, _user \\ nil) do
    Ecto.Multi.new()
    |> Ecto.Multi.insert(:taxon, Taxon.changeset(%Taxon{}, attrs))
    |> Repo.transaction()
    |> case do
      {:ok, %{taxon: taxon}} -> {:ok, taxon}
      {:error, :taxon, changeset, _} -> {:error, changeset}
    end
  end

  def update_taxon(%Taxon{} = taxon, attrs, user) do
    Ecto.Multi.new()
    |> Ecto.Multi.run(:version, fn _repo, _ ->
      snapshot = Map.take(taxon, [:scientific_name, :common_name, :taxonomic_level, :is_non_taxonomic, :parent_id, :category_id])
      %TaxonVersion{}
      |> TaxonVersion.changeset(%{taxon_id: taxon.id, changed_by_id: user.id, changes: attrs, snapshot: snapshot})
      |> Repo.insert()
    end)
    |> Ecto.Multi.update(:taxon, Taxon.changeset(taxon, attrs))
    |> Repo.transaction()
    |> case do
      {:ok, %{taxon: updated}} -> {:ok, updated}
      {:error, :taxon, changeset, _} -> {:error, changeset}
    end
  end

  def delete_taxon(%Taxon{} = taxon) do
    if has_dependents?(taxon) do
      {:error, :has_dependents}
    else
      Repo.delete(taxon)
    end
  end

  def list_versions(taxon_id) do
    from(v in TaxonVersion, where: v.taxon_id == ^taxon_id, order_by: [desc: v.inserted_at], preload: [:changed_by])
    |> Repo.all()
  end

  def list_taxon_versions(taxon_id), do: list_versions(taxon_id)

  def restore_version(%TaxonVersion{} = version, user) do
    taxon = get_taxon!(version.taxon_id)
    update_taxon(taxon, version.snapshot, user)
  end

  # ── External links ────────────────────────────────────────────────────────

  def add_external_link(taxon_id, attrs) do
    %TaxonExternalLink{}
    |> TaxonExternalLink.changeset(Map.put(attrs, :taxon_id, taxon_id))
    |> Repo.insert()
  end

  def delete_external_link(id), do: Repo.delete(get_taxon_link!(id))

  defp get_taxon_link!(id), do: Repo.get!(TaxonExternalLink, id)

  # ── Private helpers ───────────────────────────────────────────────────────

  defp maybe_filter_category(query, nil), do: query
  defp maybe_filter_category(query, id), do: where(query, [t], t.category_id == ^id)

  defp maybe_filter_level(query, nil), do: query
  defp maybe_filter_level(query, level), do: where(query, [t], t.taxonomic_level == ^level)

  defp maybe_search(query, nil), do: query
  defp maybe_search(query, term) do
    pattern = "%#{term}%"
    where(query, [t], ilike(t.scientific_name, ^pattern) or ilike(t.common_name, ^pattern))
  end

  defp has_dependents?(%Taxon{id: id}) do
    children_count = from(t in Taxon, where: t.parent_id == ^id, select: count(t.id)) |> Repo.one()
    stock_count = from(s in Repousse.Distributions.Stock, where: s.taxon_id == ^id, select: count(s.id)) |> Repo.one()
    children_count + stock_count > 0
  end
end
