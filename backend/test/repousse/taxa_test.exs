defmodule Repousse.TaxaTest do
  use Repousse.DataCase, async: true

  import Repousse.Factory

  alias Repousse.Taxa
  alias Repousse.Taxa.TaxonExternalLink

  describe "categories (US-TAX-01)" do
    test "create/update/list categories" do
      assert {:ok, category} = Taxa.create_taxon_category(%{name: "Arbre fruitier"})
      assert category.slug == "arbre-fruitier"

      assert {:ok, renamed} = Taxa.update_taxon_category(category, %{name: "Fruitier"})
      assert renamed.slug == "fruitier"

      assert Enum.any?(Taxa.list_taxon_categories(), &(&1.id == category.id))
    end

    test "deletion is blocked while a taxon still uses the category" do
      category = insert(:taxon_category)
      insert(:taxon, category: category)

      assert {:error, message} = Taxa.delete_taxon_category(category)
      assert message =~ "taxons"
      assert Taxa.get_taxon_category!(category.id)
    end

    test "deletion succeeds once no taxon references the category" do
      category = insert(:taxon_category)
      assert {:ok, _} = Taxa.delete_taxon_category(category)
    end
  end

  describe "create_taxon/2 (US-TAX-02)" do
    test "creates a taxonomic entry with a scientific name" do
      category = insert(:taxon_category)

      assert {:ok, taxon} =
               Taxa.create_taxon(%{
                 scientific_name: "Malus domestica",
                 common_name: "Pommier",
                 taxonomic_level: :species,
                 category_id: category.id
               })

      assert taxon.common_name == "Pommier"
    end

    test "non-taxonomic entries are allowed without a scientific name" do
      category = insert(:taxon_category)

      assert {:ok, taxon} =
               Taxa.create_taxon(%{
                 common_name: "Plante grimpante non identifiée",
                 is_non_taxonomic: true,
                 category_id: category.id
               })

      assert taxon.is_non_taxonomic
      assert is_nil(taxon.scientific_name)
    end

    test "requires a scientific name and level for taxonomic entries" do
      category = insert(:taxon_category)

      assert {:error, changeset} =
               Taxa.create_taxon(%{common_name: "Sans nom latin", category_id: category.id})

      assert %{scientific_name: ["can't be blank"], taxonomic_level: ["can't be blank"]} =
               errors_on(changeset)
    end

    test "common name is always required" do
      assert {:error, changeset} = Taxa.create_taxon(%{scientific_name: "Quercus robur"})
      assert %{common_name: ["can't be blank"]} = errors_on(changeset)
    end
  end

  describe "update_taxon/3 (US-TAX-04) and versioning" do
    test "each modification is tracked in the version history" do
      taxon = insert(:taxon, common_name: "Ancien nom")
      user = insert(:user)

      assert {:ok, updated} = Taxa.update_taxon(taxon, %{common_name: "Nouveau nom"}, user)
      assert updated.common_name == "Nouveau nom"

      [version] = Taxa.list_taxon_versions(taxon.id)
      assert version.changed_by_id == user.id
      assert version.snapshot["common_name"] == "Ancien nom"
    end

    test "invalid updates roll back without creating a version" do
      taxon = insert(:taxon)
      user = insert(:user)

      assert {:error, _changeset} = Taxa.update_taxon(taxon, %{common_name: ""}, user)
      assert Taxa.list_taxon_versions(taxon.id) == []
    end
  end

  describe "restore_version/2 (US-TAX-05)" do
    test "restoring an earlier version creates a new version rather than overwriting silently" do
      taxon = insert(:taxon, common_name: "V1")
      user = insert(:user)

      {:ok, _v2} = Taxa.update_taxon(taxon, %{common_name: "V2"}, user)
      # Grab the just-created version (snapshot common_name: "V1") before a
      # second version exists — `timestamps(type: :utc_datetime)` is
      # second-granularity, so two versions created within the same second
      # would otherwise tie on `list_taxon_versions/1`'s `order_by: [desc:
      # inserted_at]` and make picking "the older one" by position flaky.
      [v1_snapshot] = Taxa.list_taxon_versions(taxon.id)
      assert v1_snapshot.snapshot["common_name"] == "V1"

      taxon_v2 = Taxa.get_taxon!(taxon.id)
      {:ok, _v3} = Taxa.update_taxon(taxon_v2, %{common_name: "V3"}, user)

      assert {:ok, restored} = Taxa.restore_version(v1_snapshot, user)
      assert restored.common_name == "V1"

      # restoring itself created one more version — history keeps growing
      versions = Taxa.list_taxon_versions(taxon.id)
      assert length(versions) == 3
    end
  end

  describe "delete_taxon/1 (US-TAX-03, US-TAX-06)" do
    test "deletes a taxon with no dependents" do
      taxon = insert(:taxon)
      assert {:ok, _} = Taxa.delete_taxon(taxon)
      refute Taxa.get_taxon(taxon.id)
    end

    test "blocked when the taxon has children" do
      parent = insert(:taxon)
      insert(:taxon, parent: parent)

      assert {:error, message} = Taxa.delete_taxon(parent)
      assert message =~ "enfants"
    end

    test "blocked when referenced by a distribution stock" do
      taxon = insert(:taxon)
      event = insert(:distribution_event)

      {:ok, _stock} =
        %Repousse.Distributions.Stock{}
        |> Repousse.Distributions.Stock.changeset(%{
          event_id: event.id,
          taxon_id: taxon.id,
          quantity_unknown: true
        })
        |> Repo.insert()

      assert {:error, message} = Taxa.delete_taxon(taxon)
      assert message =~ "stock"
    end

    test "blocked when preferred in a planting project" do
      taxon = insert(:taxon)
      project = insert(:project)

      {:ok, _preferred} =
        %Repousse.Projects.PreferredSpecies{}
        |> Repousse.Projects.PreferredSpecies.changeset(%{
          project_id: project.id,
          taxon_id: taxon.id
        })
        |> Repo.insert()

      assert {:error, message} = Taxa.delete_taxon(taxon)
      assert message =~ "projet"
    end
  end

  describe "external links (US-TAX-08)" do
    test "add_external_link/2 attaches a link to a taxon" do
      taxon = insert(:taxon)

      assert {:ok, %TaxonExternalLink{} = link} =
               Taxa.add_external_link(taxon.id, %{
                 source_name: "Wikipedia",
                 url: "https://fr.wikipedia.org/wiki/x"
               })

      assert link.taxon_id == taxon.id

      taxon = Taxa.get_taxon_with_tree(taxon.id)
      assert [%TaxonExternalLink{source_name: "Wikipedia"}] = taxon.external_links
    end

    test "rejects a non-http(s) url" do
      taxon = insert(:taxon)

      assert {:error, changeset} =
               Taxa.add_external_link(taxon.id, %{source_name: "Floriscope", url: "not-a-url"})

      assert %{url: [_]} = errors_on(changeset)
    end

    test "external links can be managed as nested attrs on taxon update" do
      taxon = insert(:taxon)
      user = insert(:user)

      assert {:ok, updated} =
               Taxa.update_taxon(
                 taxon,
                 %{
                   "external_links" => [
                     %{
                       "source_name" => "GloBI",
                       "url" => "https://globalbioticinteractions.org/x"
                     }
                   ]
                 },
                 user
               )

      updated = Taxa.get_taxon_with_tree(updated.id)
      assert [%TaxonExternalLink{source_name: "GloBI"}] = updated.external_links
    end

    test "delete_external_link/1 removes the link" do
      taxon = insert(:taxon)

      {:ok, link} =
        Taxa.add_external_link(taxon.id, %{source_name: "DoPI", url: "https://dopi.example/x"})

      assert {:ok, _} = Taxa.delete_external_link(link.id)
      taxon = Taxa.get_taxon_with_tree(taxon.id)
      assert taxon.external_links == []
    end
  end

  describe "search and filters (US-TAX-10)" do
    test "search_taxa/1 matches scientific or common name" do
      insert(:taxon, scientific_name: "Prunus avium", common_name: "Merisier")
      insert(:taxon, scientific_name: "Pyrus communis", common_name: "Poirier")

      assert [%{common_name: "Merisier"}] = Taxa.search_taxa("avium")
      assert [%{common_name: "Poirier"}] = Taxa.search_taxa("poirier")
    end

    test "list_taxa/1 filters by category and level" do
      category = insert(:taxon_category)
      match = insert(:taxon, category: category, taxonomic_level: :genus)
      insert(:taxon, taxonomic_level: :species)

      results = Taxa.list_taxa(category_id: category.id, level: :genus)
      assert [%{id: id}] = results
      assert id == match.id
    end
  end
end
