# Script for populating the database. You can run it as:
#
#     mix run priv/repo/seeds.exs
#
# Also runs automatically via `mix setup` / `mix ecto.setup`.
#
# Seeds one dev user per app role, each backed by a real Hanko identity
# (passcode login via Mailpit at http://mail.localhost). Re-runnable: Hanko
# lookup falls back to the existing user on 409, and the DB upsert keys off
# hanko_id — running this twice just refreshes the four accounts.

alias Repousse.Accounts
alias Repousse.Auth.HankoAdmin

seed_users = [
  %{
    email: "superadmin@repousse.local",
    first_name: "Super",
    last_name: "Admin",
    role: :superadmin,
    taxon_editor: false
  },
  %{
    email: "admin@repousse.local",
    first_name: "Admin",
    last_name: "Repousse",
    role: :admin,
    taxon_editor: false
  },
  %{
    email: "editeur@repousse.local",
    first_name: "Editeur",
    last_name: "Repousse",
    role: :member,
    taxon_editor: true
  },
  %{
    email: "lecteur@repousse.local",
    first_name: "Lecteur",
    last_name: "Repousse",
    role: :member,
    taxon_editor: false
  }
]

for attrs <- seed_users do
  IO.puts("→ Seeding #{attrs.email} (role=#{attrs.role}, taxon_editor=#{attrs.taxon_editor})...")

  hanko_id =
    case HankoAdmin.create_or_find_user(attrs.email, is_verified: true) do
      {:ok, id} -> id
      {:error, reason} -> raise "Failed to create Hanko user for #{attrs.email}: #{reason}"
    end

  user = Accounts.find_or_create_by_hanko_id!(hanko_id, attrs.email)

  {:ok, user} =
    Accounts.update_user(user, %{
      "first_name" => attrs.first_name,
      "last_name" => attrs.last_name
    })

  {:ok, user} =
    case Accounts.assign_role(user, attrs.role) do
      {:ok, user} -> {:ok, user}
      {:error, :last_superadmin} -> {:ok, user}
    end

  {:ok, user} = Accounts.set_taxon_editor(user, attrs.taxon_editor)

  IO.puts("  ✓ #{attrs.email} ready (id: #{user.id}, role: #{user.role})")
end

IO.puts("\nDone. Log in at http://mail.localhost (Mailpit) to fetch each passcode.\n")

# ── Espèces végétales (dev seed, mirrors the frontend mock catalogue) ───────
#
# Idempotent: categories upsert by slug, taxa upsert by scientific_name (or
# common_name for the one non-taxonomic entry, since scientific_name is
# nullable there). Re-running just refreshes the same rows.

alias Repousse.Taxa
alias Repousse.Taxa.TaxonCategory

IO.puts("\n→ Seeding espèces végétales catalogue...")

category_names = ["Arbre", "Arbuste", "Fruitier", "Plante grimpante", "Plante vivace", "Couvre-sol"]

categories_by_name =
  for name <- category_names, into: %{} do
    slug = name |> String.downcase() |> String.replace(~r/[^a-z0-9]+/, "-") |> String.trim("-")

    category =
      case Repousse.Repo.get_by(TaxonCategory, slug: slug) do
        nil ->
          {:ok, cat} = Taxa.create_category(%{name: name})
          cat

        existing ->
          existing
      end

    {name, category}
  end

# Flat list mirroring webapp/src/app/(main)/admin/especes-vegetales/_components/data.ts,
# ordered genus → species → variety so each :parent_slug resolves against
# already-seeded rows.
taxa_seed = [
  # Quercus
  %{slug: "quercus", parent_slug: nil, nom_scientifique: "Quercus", nom_commun: "Chêne", niveau: :genus, categorie: "Arbre", non_taxonomique: false, image_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Quercus_robur_acorn_-_Keila.jpg/500px-Quercus_robur_acorn_-_Keila.jpg", liens: [{"Floriscope", "https://floriscope.io/quercus"}]},
  %{slug: "quercus-robur", parent_slug: "quercus", nom_scientifique: "Quercus robur", nom_commun: "Chêne pédonculé", niveau: :species, categorie: "Arbre", non_taxonomique: false, image_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/Quercus_robur.jpg/500px-Quercus_robur.jpg", liens: [{"Floriscope", "https://floriscope.io/quercus-robur"}, {"Wikipedia", "https://fr.wikipedia.org/wiki/Ch%C3%AAne_p%C3%A9doncul%C3%A9"}]},
  %{slug: "quercus-robur-fastigiata", parent_slug: "quercus-robur", nom_scientifique: "Quercus robur 'Fastigiata'", nom_commun: "Chêne fastigié", niveau: :variety, categorie: "Arbre", non_taxonomique: false, image_url: nil, liens: []},
  %{slug: "quercus-petraea", parent_slug: "quercus", nom_scientifique: "Quercus petraea", nom_commun: "Chêne sessile", niveau: :species, categorie: "Arbre", non_taxonomique: false, image_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Quercus_petraea_06.jpg/500px-Quercus_petraea_06.jpg", liens: [{"Wikipedia", "https://fr.wikipedia.org/wiki/Ch%C3%AAne_sessile"}]},
  %{slug: "quercus-pubescens", parent_slug: "quercus", nom_scientifique: "Quercus pubescens", nom_commun: "Chêne pubescent", niveau: :species, categorie: "Arbre", non_taxonomique: false, image_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Quercus_pubescens_Tuscany.jpg/500px-Quercus_pubescens_Tuscany.jpg", liens: []},

  # Fagus
  %{slug: "fagus", parent_slug: nil, nom_scientifique: "Fagus", nom_commun: "Hêtre", niveau: :genus, categorie: "Arbre", non_taxonomique: false, image_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Vrucht_van_een_beuk_%28Fagus_sylvatica%29_21-07-2023_%28d.j.b.%29.jpg/500px-Vrucht_van_een_beuk_%28Fagus_sylvatica%29_21-07-2023_%28d.j.b.%29.jpg", liens: []},
  %{slug: "fagus-sylvatica", parent_slug: "fagus", nom_scientifique: "Fagus sylvatica", nom_commun: "Hêtre commun", niveau: :species, categorie: "Arbre", non_taxonomique: false, image_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Fagus-sylvatica-cansiglio-forest-italy.jpg/500px-Fagus-sylvatica-cansiglio-forest-italy.jpg", liens: [{"Wikipedia", "https://fr.wikipedia.org/wiki/H%C3%AAtre_commun"}]},
  %{slug: "fagus-sylvatica-purpurea", parent_slug: "fagus-sylvatica", nom_scientifique: "Fagus sylvatica 'Purpurea'", nom_commun: "Hêtre pourpre", niveau: :variety, categorie: "Arbre", non_taxonomique: false, image_url: nil, liens: []},

  # Acer
  %{slug: "acer", parent_slug: nil, nom_scientifique: "Acer", nom_commun: "Érable", niveau: :genus, categorie: "Arbre", non_taxonomique: false, image_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/db/Acer_rubrum_seed_keys.jpg/500px-Acer_rubrum_seed_keys.jpg", liens: []},
  %{slug: "acer-campestre", parent_slug: "acer", nom_scientifique: "Acer campestre", nom_commun: "Érable champêtre", niveau: :species, categorie: "Arbre", non_taxonomique: false, image_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/Acer_campestre_in_Appennino2.jpg/500px-Acer_campestre_in_Appennino2.jpg", liens: [{"Floriscope", "https://floriscope.io/acer-campestre"}]},
  %{slug: "acer-campestre-elsrijk", parent_slug: "acer-campestre", nom_scientifique: "Acer campestre 'Elsrijk'", nom_commun: "Érable champêtre 'Elsrijk'", niveau: :variety, categorie: "Arbre", non_taxonomique: false, image_url: nil, liens: []},
  %{slug: "acer-pseudoplatanus", parent_slug: "acer", nom_scientifique: "Acer pseudoplatanus", nom_commun: "Sycomore", niveau: :species, categorie: "Arbre", non_taxonomique: false, image_url: nil, liens: []},

  # Alnus
  %{slug: "alnus", parent_slug: nil, nom_scientifique: "Alnus", nom_commun: "Aulne", niveau: :genus, categorie: "Arbre", non_taxonomique: false, image_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/Common_Alder_%28Alnus_glutinosa%29_cone_%288256950549%29.jpg/500px-Common_Alder_%28Alnus_glutinosa%29_cone_%288256950549%29.jpg", liens: []},
  %{slug: "alnus-glutinosa", parent_slug: "alnus", nom_scientifique: "Alnus glutinosa", nom_commun: "Aulne glutineux", niveau: :species, categorie: "Arbre", non_taxonomique: false, image_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/20120904Alnus_glutinosa01.jpg/500px-20120904Alnus_glutinosa01.jpg", liens: [{"Floriscope", "https://floriscope.io/alnus-glutinosa"}]},

  # Corylus
  %{slug: "corylus", parent_slug: nil, nom_scientifique: "Corylus", nom_commun: "Noisetier", niveau: :genus, categorie: "Arbuste", non_taxonomique: false, image_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Hazelnuts_%28Corylus_avellana%29_-_whole_with_kernels.jpg/500px-Hazelnuts_%28Corylus_avellana%29_-_whole_with_kernels.jpg", liens: []},
  %{slug: "corylus-avellana", parent_slug: "corylus", nom_scientifique: "Corylus avellana", nom_commun: "Noisetier commun", niveau: :species, categorie: "Arbuste", non_taxonomique: false, image_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Corylus_avellana.jpg/500px-Corylus_avellana.jpg", liens: [{"Floriscope", "https://floriscope.io/corylus-avellana"}]},
  %{slug: "corylus-avellana-contorta", parent_slug: "corylus-avellana", nom_scientifique: "Corylus avellana 'Contorta'", nom_commun: "Noisetier tortueux", niveau: :variety, categorie: "Arbuste", non_taxonomique: false, image_url: nil, liens: []},

  # Cornus
  %{slug: "cornus", parent_slug: nil, nom_scientifique: "Cornus", nom_commun: "Cornouiller", niveau: :genus, categorie: "Arbuste", non_taxonomique: false, image_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Cornus_sanguinea_berries.jpg/500px-Cornus_sanguinea_berries.jpg", liens: []},
  %{slug: "cornus-sanguinea", parent_slug: "cornus", nom_scientifique: "Cornus sanguinea", nom_commun: "Cornouiller sanguin", niveau: :species, categorie: "Arbuste", non_taxonomique: false, image_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Cornus_sanguinea_Sturm39.jpg/500px-Cornus_sanguinea_Sturm39.jpg", liens: [{"Wikipedia", "https://fr.wikipedia.org/wiki/Cornouiller_sanguin"}]},
  %{slug: "cornus-mas", parent_slug: "cornus", nom_scientifique: "Cornus mas", nom_commun: "Cornouiller mâle", niveau: :species, categorie: "Fruitier", non_taxonomique: false, image_url: nil, liens: []},

  # Sambucus
  %{slug: "sambucus", parent_slug: nil, nom_scientifique: "Sambucus", nom_commun: "Sureau", niveau: :genus, categorie: "Arbuste", non_taxonomique: false, image_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Sambucus-berries.jpg/500px-Sambucus-berries.jpg", liens: []},
  %{slug: "sambucus-nigra", parent_slug: "sambucus", nom_scientifique: "Sambucus nigra", nom_commun: "Sureau noir", niveau: :species, categorie: "Arbuste", non_taxonomique: false, image_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/Sambucus_nigra_004.jpg/500px-Sambucus_nigra_004.jpg", liens: [{"Wikipedia", "https://fr.wikipedia.org/wiki/Sureau_noir"}]},

  # Frangula
  %{slug: "frangula", parent_slug: nil, nom_scientifique: "Frangula", nom_commun: "Bourdaine", niveau: :genus, categorie: "Arbuste", non_taxonomique: false, image_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Frangula-alnus-fruits.JPG/500px-Frangula-alnus-fruits.JPG", liens: []},
  %{slug: "frangula-alnus", parent_slug: "frangula", nom_scientifique: "Frangula alnus", nom_commun: "Bourdaine", niveau: :species, categorie: "Arbuste", non_taxonomique: false, image_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Frangula-alnus-fruits.JPG/500px-Frangula-alnus-fruits.JPG", liens: []},

  # Rosa
  %{slug: "rosa", parent_slug: nil, nom_scientifique: "Rosa", nom_commun: "Rosier", niveau: :genus, categorie: "Arbuste", non_taxonomique: false, image_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Rosa_canina_fruits.jpg/500px-Rosa_canina_fruits.jpg", liens: []},
  %{slug: "rosa-canina", parent_slug: "rosa", nom_scientifique: "Rosa canina", nom_commun: "Rosier des chiens", niveau: :species, categorie: "Arbuste", non_taxonomique: false, image_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/Divlja_ruza_cvijet_270508.jpg/500px-Divlja_ruza_cvijet_270508.jpg", liens: []},

  # Prunus
  %{slug: "prunus", parent_slug: nil, nom_scientifique: "Prunus", nom_commun: "Prunier / Cerisier", niveau: :genus, categorie: "Fruitier", non_taxonomique: false, image_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Prunus_avium_fruit.jpg/500px-Prunus_avium_fruit.jpg", liens: []},
  %{slug: "prunus-avium", parent_slug: "prunus", nom_scientifique: "Prunus avium", nom_commun: "Merisier", niveau: :species, categorie: "Fruitier", non_taxonomique: false, image_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Prunus_avium_fruit.jpg/500px-Prunus_avium_fruit.jpg", liens: [{"Floriscope", "https://floriscope.io/prunus-avium"}]},
  %{slug: "prunus-domestica", parent_slug: "prunus", nom_scientifique: "Prunus domestica", nom_commun: "Prunier commun", niveau: :species, categorie: "Fruitier", non_taxonomique: false, image_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Fruits_Prunus_domestica.jpg/500px-Fruits_Prunus_domestica.jpg", liens: []},
  %{slug: "prunus-domestica-reine-claude", parent_slug: "prunus-domestica", nom_scientifique: "Prunus domestica 'Reine-Claude Verte'", nom_commun: "Reine-Claude Verte", niveau: :variety, categorie: "Fruitier", non_taxonomique: false, image_url: nil, liens: []},
  %{slug: "prunus-spinosa", parent_slug: "prunus", nom_scientifique: "Prunus spinosa", nom_commun: "Prunellier", niveau: :species, categorie: "Arbuste", non_taxonomique: false, image_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/Closeup_of_blackthorn_aka_sloe_aka_prunus_spinosa_sweden_20050924.jpg/500px-Closeup_of_blackthorn_aka_sloe_aka_prunus_spinosa_sweden_20050924.jpg", liens: []},

  # Malus
  %{slug: "malus", parent_slug: nil, nom_scientifique: "Malus", nom_commun: "Pommier", niveau: :genus, categorie: "Fruitier", non_taxonomique: false, image_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Purple_prince_crabapple_tree.JPG/500px-Purple_prince_crabapple_tree.JPG", liens: []},
  %{slug: "malus-domestica", parent_slug: "malus", nom_scientifique: "Malus domestica", nom_commun: "Pommier cultivé", niveau: :species, categorie: "Fruitier", non_taxonomique: false, image_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Red_Apple.jpg/500px-Red_Apple.jpg", liens: [{"Wikipedia", "https://fr.wikipedia.org/wiki/Pommier_commun"}]},
  %{slug: "malus-domestica-reinette", parent_slug: "malus-domestica", nom_scientifique: "Malus domestica 'Reinette Grise du Canada'", nom_commun: "Reinette Grise du Canada", niveau: :variety, categorie: "Fruitier", non_taxonomique: false, image_url: nil, liens: []},
  %{slug: "malus-domestica-cox", parent_slug: "malus-domestica", nom_scientifique: "Malus domestica 'Cox's Orange Pippin'", nom_commun: "Cox Orange", niveau: :variety, categorie: "Fruitier", non_taxonomique: false, image_url: nil, liens: []},
  %{slug: "malus-sylvestris", parent_slug: "malus", nom_scientifique: "Malus sylvestris", nom_commun: "Pommier sauvage", niveau: :species, categorie: "Fruitier", non_taxonomique: false, image_url: nil, liens: []},

  # Hedera
  %{slug: "hedera", parent_slug: nil, nom_scientifique: "Hedera", nom_commun: "Lierre", niveau: :genus, categorie: "Plante grimpante", non_taxonomique: false, image_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Hedera_algeriensis_kz01.jpg/500px-Hedera_algeriensis_kz01.jpg", liens: []},
  %{slug: "hedera-helix", parent_slug: "hedera", nom_scientifique: "Hedera helix", nom_commun: "Lierre grimpant", niveau: :species, categorie: "Plante grimpante", non_taxonomique: false, image_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Hedera_helix_Dover.jpg/500px-Hedera_helix_Dover.jpg", liens: [{"Floriscope", "https://floriscope.io/hedera-helix"}]},
  %{slug: "hedera-helix-baltica", parent_slug: "hedera-helix", nom_scientifique: "Hedera helix 'Baltica'", nom_commun: "Lierre de Baltique", niveau: :variety, categorie: "Plante grimpante", non_taxonomique: false, image_url: nil, liens: []},

  # Lonicera
  %{slug: "lonicera", parent_slug: nil, nom_scientifique: "Lonicera", nom_commun: "Chèvrefeuille", niveau: :genus, categorie: "Plante grimpante", non_taxonomique: false, image_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Lonicera_caprifolium001.jpg/500px-Lonicera_caprifolium001.jpg", liens: []},
  %{slug: "lonicera-periclymenum", parent_slug: "lonicera", nom_scientifique: "Lonicera periclymenum", nom_commun: "Chèvrefeuille des bois", niveau: :species, categorie: "Plante grimpante", non_taxonomique: false, image_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/European_honeysuckle_800.jpg/500px-European_honeysuckle_800.jpg", liens: []},

  # Non-taxonomique
  %{slug: "plante-grimpante-ni", parent_slug: nil, nom_scientifique: nil, nom_commun: "Plante grimpante non identifiée", niveau: :genus, categorie: "Plante grimpante", non_taxonomique: true, image_url: nil, liens: []}
]

_taxa_by_slug =
  Enum.reduce(taxa_seed, %{}, fn row, acc ->
    parent_id = row.parent_slug && Map.fetch!(acc, row.parent_slug).id
    category = Map.fetch!(categories_by_name, row.categorie)

    lookup = if row.nom_scientifique, do: [scientific_name: row.nom_scientifique], else: [common_name: row.nom_commun]

    taxon =
      case Repousse.Repo.get_by(Repousse.Taxa.Taxon, lookup) do
        nil ->
          {:ok, taxon} =
            Taxa.create_taxon(%{
              scientific_name: row.nom_scientifique,
              common_name: row.nom_commun,
              taxonomic_level: row.niveau,
              is_non_taxonomic: row.non_taxonomique,
              image_url: row.image_url,
              parent_id: parent_id,
              category_id: category.id
            })

          for {source, url} <- row.liens do
            {:ok, _} = Taxa.add_external_link(taxon.id, %{source_name: source, url: url})
          end

          taxon

        existing ->
          existing
      end

    Map.put(acc, row.slug, taxon)
  end)

IO.puts("  ✓ #{length(taxa_seed)} taxons (#{map_size(categories_by_name)} catégories) prêts.\n")
