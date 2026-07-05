defmodule Repousse.Taxa do
  import Ecto.Query
  alias Repousse.Repo
  alias Repousse.Taxa.{Taxon, TaxonCategory, TaxonExternalLink, TaxonVersion}

  # ── Categories ────────────────────────────────────────────────────────────

  def list_categories, do: Repo.all(TaxonCategory)
  def list_taxon_categories, do: list_categories()
  def get_category!(id), do: Repo.get!(TaxonCategory, id)
  def get_taxon_category!(id), do: get_category!(id)

  def create_category(attrs),
    do: %TaxonCategory{} |> TaxonCategory.changeset(attrs) |> Repo.insert()

  def create_taxon_category(attrs), do: create_category(attrs)

  def update_category(%TaxonCategory{} = cat, attrs),
    do: cat |> TaxonCategory.changeset(attrs) |> Repo.update()

  def update_taxon_category(%TaxonCategory{} = cat, attrs), do: update_category(cat, attrs)

  # US-TAX-01: "Suppression bloquée si des taxons utilisent encore la catégorie"
  def delete_category(%TaxonCategory{} = cat) do
    if Repo.exists?(from(t in Taxon, where: t.category_id == ^cat.id)) do
      {:error, "Impossible de supprimer cette catégorie : utilisée par un ou plusieurs taxons"}
    else
      Repo.delete(cat)
    end
  end

  def delete_taxon_category(%TaxonCategory{} = cat), do: delete_category(cat)

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
    # `Taxon.changeset/2` `cast_assoc`s `:external_links` (so they can be
    # managed as nested attrs — see US-TAX-08); Ecto requires the
    # association to be loaded before casting whenever the caller's attrs
    # actually include an "external_links" key, and callers may pass in a
    # taxon fetched via `get_taxon!/1` (no preload).
    taxon = Repo.preload(taxon, :external_links)

    Ecto.Multi.new()
    |> Ecto.Multi.run(:version, fn _repo, _ ->
      snapshot =
        Map.take(taxon, [
          :scientific_name,
          :common_name,
          :taxonomic_level,
          :is_non_taxonomic,
          :parent_id,
          :category_id
        ])

      %TaxonVersion{}
      |> TaxonVersion.changeset(%{
        taxon_id: taxon.id,
        changed_by_id: user.id,
        changes: attrs,
        snapshot: snapshot
      })
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
    case dependents_of(taxon) do
      [] ->
        Repo.delete(taxon)

      reasons ->
        {:error, "Impossible de supprimer ce taxon : utilisé par #{Enum.join(reasons, ", ")}"}
    end
  end

  def list_versions(taxon_id) do
    from(v in TaxonVersion,
      where: v.taxon_id == ^taxon_id,
      order_by: [desc: v.inserted_at],
      preload: [:changed_by]
    )
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

  # US-TAX-06: deletion is blocked if the taxon has children, is referenced by
  # a distribution stock, or is a preferred species in a planting project —
  # returns the list of French labels for whichever of those block it, so the
  # controller can surface "Impossible de supprimer ... utilisé par X, Y".
  defp dependents_of(%Taxon{id: id}) do
    []
    |> maybe_dependent(exists?(from(t in Taxon, where: t.parent_id == ^id)), "des taxons enfants")
    |> maybe_dependent(
      exists?(from(s in Repousse.Distributions.Stock, where: s.taxon_id == ^id)),
      "un ou plusieurs stocks de distribution"
    )
    |> maybe_dependent(
      exists?(from(p in Repousse.Projects.PreferredSpecies, where: p.taxon_id == ^id)),
      "un ou plusieurs projets de plantation"
    )
  end

  defp exists?(query), do: Repo.exists?(query)

  defp maybe_dependent(reasons, true, label), do: reasons ++ [label]
  defp maybe_dependent(reasons, false, _label), do: reasons
end
