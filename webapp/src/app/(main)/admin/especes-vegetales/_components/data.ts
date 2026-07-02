export type Categorie =
  | "Arbre"
  | "Arbuste"
  | "Fruitier"
  | "Plante grimpante"
  | "Plante vivace"
  | "Couvre-sol";

export type NiveauTaxonomique = "Genre" | "Espèce" | "Variété/Cultivar";

export interface LienExterne {
  source: string;
  url: string;
}

export interface Taxon {
  id: string;
  nomScientifique: string | null;
  nomCommun: string;
  niveau: NiveauTaxonomique;
  categorie: Categorie;
  nonTaxonomique: boolean;
  imageUrl?: string;
  liens: LienExterne[];
  nbDistributions: number;
  nbProjets: number;
  children?: Taxon[];
}

export const CATEGORIES: Categorie[] = [
  "Arbre",
  "Arbuste",
  "Fruitier",
  "Plante grimpante",
  "Plante vivace",
  "Couvre-sol",
];

export const NIVEAUX: NiveauTaxonomique[] = ["Genre", "Espèce", "Variété/Cultivar"];

export const SOURCES_LIENS = [
  "Floriscope",
  "Wikipedia",
  "Wikidata",
  "Encyclopedia of Life",
  "DoPI",
  "GloBI",
  "Autre",
];

export const CATEGORIE_COLORS: Record<Categorie, string> = {
  Arbre: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  Arbuste: "bg-lime-100 text-lime-800 dark:bg-lime-900/30 dark:text-lime-300",
  Fruitier: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  "Plante grimpante": "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300",
  "Plante vivace": "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300",
  "Couvre-sol": "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
};

export const NIVEAU_COLORS: Record<NiveauTaxonomique, string> = {
  Genre: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  "Espèce": "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  "Variété/Cultivar": "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
};

export const taxons: Taxon[] = [
  // ── QUERCUS ─────────────────────────────────────────────────────────────────
  {
    id: "quercus",
    nomScientifique: "Quercus",
    nomCommun: "Chêne",
    niveau: "Genre",
    categorie: "Arbre",
    nonTaxonomique: false,
    // Glands de chêne pédonculé — fruit caractéristique du genre
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Quercus_robur_acorn_-_Keila.jpg/500px-Quercus_robur_acorn_-_Keila.jpg",
    liens: [{ source: "Floriscope", url: "https://floriscope.io/quercus" }],
    nbDistributions: 0,
    nbProjets: 0,
    children: [
      {
        id: "quercus-robur",
        nomScientifique: "Quercus robur",
        nomCommun: "Chêne pédonculé",
        niveau: "Espèce",
        categorie: "Arbre",
        nonTaxonomique: false,
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/Quercus_robur.jpg/500px-Quercus_robur.jpg",
        liens: [
          { source: "Floriscope", url: "https://floriscope.io/quercus-robur" },
          { source: "Wikipedia", url: "https://fr.wikipedia.org/wiki/Ch%C3%AAne_p%C3%A9doncul%C3%A9" },
        ],
        nbDistributions: 12,
        nbProjets: 4,
        children: [
          {
            id: "quercus-robur-fastigiata",
            nomScientifique: "Quercus robur 'Fastigiata'",
            nomCommun: "Chêne fastigié",
            niveau: "Variété/Cultivar",
            categorie: "Arbre",
            nonTaxonomique: false,
            liens: [],
            nbDistributions: 2,
            nbProjets: 1,
          },
        ],
      },
      {
        id: "quercus-petraea",
        nomScientifique: "Quercus petraea",
        nomCommun: "Chêne sessile",
        niveau: "Espèce",
        categorie: "Arbre",
        nonTaxonomique: false,
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Quercus_petraea_06.jpg/500px-Quercus_petraea_06.jpg",
        liens: [{ source: "Wikipedia", url: "https://fr.wikipedia.org/wiki/Ch%C3%AAne_sessile" }],
        nbDistributions: 5,
        nbProjets: 2,
      },
      {
        id: "quercus-pubescens",
        nomScientifique: "Quercus pubescens",
        nomCommun: "Chêne pubescent",
        niveau: "Espèce",
        categorie: "Arbre",
        nonTaxonomique: false,
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Quercus_pubescens_Tuscany.jpg/500px-Quercus_pubescens_Tuscany.jpg",
        liens: [],
        nbDistributions: 1,
        nbProjets: 0,
      },
    ],
  },

  // ── FAGUS ────────────────────────────────────────────────────────────────────
  {
    id: "fagus",
    nomScientifique: "Fagus",
    nomCommun: "Hêtre",
    niveau: "Genre",
    categorie: "Arbre",
    nonTaxonomique: false,
    // Faînes (fruits du hêtre) — cupule caractéristique du genre
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Vrucht_van_een_beuk_%28Fagus_sylvatica%29_21-07-2023_%28d.j.b.%29.jpg/500px-Vrucht_van_een_beuk_%28Fagus_sylvatica%29_21-07-2023_%28d.j.b.%29.jpg",
    liens: [],
    nbDistributions: 0,
    nbProjets: 0,
    children: [
      {
        id: "fagus-sylvatica",
        nomScientifique: "Fagus sylvatica",
        nomCommun: "Hêtre commun",
        niveau: "Espèce",
        categorie: "Arbre",
        nonTaxonomique: false,
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Fagus-sylvatica-cansiglio-forest-italy.jpg/500px-Fagus-sylvatica-cansiglio-forest-italy.jpg",
        liens: [{ source: "Wikipedia", url: "https://fr.wikipedia.org/wiki/H%C3%AAtre_commun" }],
        nbDistributions: 8,
        nbProjets: 3,
        children: [
          {
            id: "fagus-sylvatica-purpurea",
            nomScientifique: "Fagus sylvatica 'Purpurea'",
            nomCommun: "Hêtre pourpre",
            niveau: "Variété/Cultivar",
            categorie: "Arbre",
            nonTaxonomique: false,
            liens: [],
            nbDistributions: 1,
            nbProjets: 1,
          },
        ],
      },
    ],
  },

  // ── ACER ─────────────────────────────────────────────────────────────────────
  {
    id: "acer",
    nomScientifique: "Acer",
    nomCommun: "Érable",
    niveau: "Genre",
    categorie: "Arbre",
    nonTaxonomique: false,
    // Samares d'érable — disamares ailées caractéristiques du genre
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/db/Acer_rubrum_seed_keys.jpg/500px-Acer_rubrum_seed_keys.jpg",
    liens: [],
    nbDistributions: 0,
    nbProjets: 0,
    children: [
      {
        id: "acer-campestre",
        nomScientifique: "Acer campestre",
        nomCommun: "Érable champêtre",
        niveau: "Espèce",
        categorie: "Arbre",
        nonTaxonomique: false,
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/Acer_campestre_in_Appennino2.jpg/500px-Acer_campestre_in_Appennino2.jpg",
        liens: [{ source: "Floriscope", url: "https://floriscope.io/acer-campestre" }],
        nbDistributions: 7,
        nbProjets: 2,
        children: [
          {
            id: "acer-campestre-elsrijk",
            nomScientifique: "Acer campestre 'Elsrijk'",
            nomCommun: "Érable champêtre 'Elsrijk'",
            niveau: "Variété/Cultivar",
            categorie: "Arbre",
            nonTaxonomique: false,
            liens: [],
            nbDistributions: 3,
            nbProjets: 1,
          },
        ],
      },
      {
        id: "acer-pseudoplatanus",
        nomScientifique: "Acer pseudoplatanus",
        nomCommun: "Sycomore",
        niveau: "Espèce",
        categorie: "Arbre",
        nonTaxonomique: false,
        liens: [],
        nbDistributions: 4,
        nbProjets: 1,
      },
    ],
  },

  // ── ALNUS ────────────────────────────────────────────────────────────────────
  {
    id: "alnus",
    nomScientifique: "Alnus",
    nomCommun: "Aulne",
    niveau: "Genre",
    categorie: "Arbre",
    nonTaxonomique: false,
    // Cônes ligneux de l'aulne — strobiles persistants caractéristiques
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/Common_Alder_%28Alnus_glutinosa%29_cone_%288256950549%29.jpg/500px-Common_Alder_%28Alnus_glutinosa%29_cone_%288256950549%29.jpg",
    liens: [],
    nbDistributions: 0,
    nbProjets: 0,
    children: [
      {
        id: "alnus-glutinosa",
        nomScientifique: "Alnus glutinosa",
        nomCommun: "Aulne glutineux",
        niveau: "Espèce",
        categorie: "Arbre",
        nonTaxonomique: false,
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/20120904Alnus_glutinosa01.jpg/500px-20120904Alnus_glutinosa01.jpg",
        liens: [{ source: "Floriscope", url: "https://floriscope.io/alnus-glutinosa" }],
        nbDistributions: 6,
        nbProjets: 3,
      },
    ],
  },

  // ── CORYLUS ──────────────────────────────────────────────────────────────────
  {
    id: "corylus",
    nomScientifique: "Corylus",
    nomCommun: "Noisetier",
    niveau: "Genre",
    categorie: "Arbuste",
    nonTaxonomique: false,
    // Noisettes — noix enveloppées de bractées, trait distinctif du genre
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Hazelnuts_%28Corylus_avellana%29_-_whole_with_kernels.jpg/500px-Hazelnuts_%28Corylus_avellana%29_-_whole_with_kernels.jpg",
    liens: [],
    nbDistributions: 0,
    nbProjets: 0,
    children: [
      {
        id: "corylus-avellana",
        nomScientifique: "Corylus avellana",
        nomCommun: "Noisetier commun",
        niveau: "Espèce",
        categorie: "Arbuste",
        nonTaxonomique: false,
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Corylus_avellana.jpg/500px-Corylus_avellana.jpg",
        liens: [{ source: "Floriscope", url: "https://floriscope.io/corylus-avellana" }],
        nbDistributions: 15,
        nbProjets: 5,
        children: [
          {
            id: "corylus-avellana-contorta",
            nomScientifique: "Corylus avellana 'Contorta'",
            nomCommun: "Noisetier tortueux",
            niveau: "Variété/Cultivar",
            categorie: "Arbuste",
            nonTaxonomique: false,
            liens: [],
            nbDistributions: 2,
            nbProjets: 0,
          },
        ],
      },
    ],
  },

  // ── CORNUS ───────────────────────────────────────────────────────────────────
  {
    id: "cornus",
    nomScientifique: "Cornus",
    nomCommun: "Cornouiller",
    niveau: "Genre",
    categorie: "Arbuste",
    nonTaxonomique: false,
    // Drupes bicolores du cornouiller sanguin — trait distinctif du genre
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Cornus_sanguinea_berries.jpg/500px-Cornus_sanguinea_berries.jpg",
    liens: [],
    nbDistributions: 0,
    nbProjets: 0,
    children: [
      {
        id: "cornus-sanguinea",
        nomScientifique: "Cornus sanguinea",
        nomCommun: "Cornouiller sanguin",
        niveau: "Espèce",
        categorie: "Arbuste",
        nonTaxonomique: false,
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Cornus_sanguinea_Sturm39.jpg/500px-Cornus_sanguinea_Sturm39.jpg",
        liens: [{ source: "Wikipedia", url: "https://fr.wikipedia.org/wiki/Cornouiller_sanguin" }],
        nbDistributions: 6,
        nbProjets: 2,
      },
      {
        id: "cornus-mas",
        nomScientifique: "Cornus mas",
        nomCommun: "Cornouiller mâle",
        niveau: "Espèce",
        categorie: "Fruitier",
        nonTaxonomique: false,
        liens: [],
        nbDistributions: 3,
        nbProjets: 1,
      },
    ],
  },

  // ── SAMBUCUS ─────────────────────────────────────────────────────────────────
  {
    id: "sambucus",
    nomScientifique: "Sambucus",
    nomCommun: "Sureau",
    niveau: "Genre",
    categorie: "Arbuste",
    nonTaxonomique: false,
    // Baies noires en corymbe — trait distinctif du genre
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Sambucus-berries.jpg/500px-Sambucus-berries.jpg",
    liens: [],
    nbDistributions: 0,
    nbProjets: 0,
    children: [
      {
        id: "sambucus-nigra",
        nomScientifique: "Sambucus nigra",
        nomCommun: "Sureau noir",
        niveau: "Espèce",
        categorie: "Arbuste",
        nonTaxonomique: false,
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/Sambucus_nigra_004.jpg/500px-Sambucus_nigra_004.jpg",
        liens: [{ source: "Wikipedia", url: "https://fr.wikipedia.org/wiki/Sureau_noir" }],
        nbDistributions: 7,
        nbProjets: 2,
      },
    ],
  },

  // ── FRANGULA ─────────────────────────────────────────────────────────────────
  {
    id: "frangula",
    nomScientifique: "Frangula",
    nomCommun: "Bourdaine",
    niveau: "Genre",
    categorie: "Arbuste",
    nonTaxonomique: false,
    // Drupes passant du rouge au noir à maturité — caractéristique du genre
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Frangula-alnus-fruits.JPG/500px-Frangula-alnus-fruits.JPG",
    liens: [],
    nbDistributions: 0,
    nbProjets: 0,
    children: [
      {
        id: "frangula-alnus",
        nomScientifique: "Frangula alnus",
        nomCommun: "Bourdaine",
        niveau: "Espèce",
        categorie: "Arbuste",
        nonTaxonomique: false,
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Frangula-alnus-fruits.JPG/500px-Frangula-alnus-fruits.JPG",
        liens: [],
        nbDistributions: 4,
        nbProjets: 1,
      },
    ],
  },

  // ── ROSA ─────────────────────────────────────────────────────────────────────
  {
    id: "rosa",
    nomScientifique: "Rosa",
    nomCommun: "Rosier",
    niveau: "Genre",
    categorie: "Arbuste",
    nonTaxonomique: false,
    // Cynorrhodons (faux-fruits rouges) — trait très distinctif du genre
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Rosa_canina_fruits.jpg/500px-Rosa_canina_fruits.jpg",
    liens: [],
    nbDistributions: 0,
    nbProjets: 0,
    children: [
      {
        id: "rosa-canina",
        nomScientifique: "Rosa canina",
        nomCommun: "Rosier des chiens",
        niveau: "Espèce",
        categorie: "Arbuste",
        nonTaxonomique: false,
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/Divlja_ruza_cvijet_270508.jpg/500px-Divlja_ruza_cvijet_270508.jpg",
        liens: [],
        nbDistributions: 8,
        nbProjets: 2,
      },
    ],
  },

  // ── PRUNUS ───────────────────────────────────────────────────────────────────
  {
    id: "prunus",
    nomScientifique: "Prunus",
    nomCommun: "Prunier / Cerisier",
    niveau: "Genre",
    categorie: "Fruitier",
    nonTaxonomique: false,
    // Drupes à noyau — cerises, prunes ; trait unificateur du genre
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Prunus_avium_fruit.jpg/500px-Prunus_avium_fruit.jpg",
    liens: [],
    nbDistributions: 0,
    nbProjets: 0,
    children: [
      {
        id: "prunus-avium",
        nomScientifique: "Prunus avium",
        nomCommun: "Merisier",
        niveau: "Espèce",
        categorie: "Fruitier",
        nonTaxonomique: false,
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Prunus_avium_fruit.jpg/500px-Prunus_avium_fruit.jpg",
        liens: [{ source: "Floriscope", url: "https://floriscope.io/prunus-avium" }],
        nbDistributions: 9,
        nbProjets: 3,
      },
      {
        id: "prunus-domestica",
        nomScientifique: "Prunus domestica",
        nomCommun: "Prunier commun",
        niveau: "Espèce",
        categorie: "Fruitier",
        nonTaxonomique: false,
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Fruits_Prunus_domestica.jpg/500px-Fruits_Prunus_domestica.jpg",
        liens: [],
        nbDistributions: 11,
        nbProjets: 4,
        children: [
          {
            id: "prunus-domestica-reine-claude",
            nomScientifique: "Prunus domestica 'Reine-Claude Verte'",
            nomCommun: "Reine-Claude Verte",
            niveau: "Variété/Cultivar",
            categorie: "Fruitier",
            nonTaxonomique: false,
            liens: [],
            nbDistributions: 5,
            nbProjets: 2,
          },
        ],
      },
      {
        id: "prunus-spinosa",
        nomScientifique: "Prunus spinosa",
        nomCommun: "Prunellier",
        niveau: "Espèce",
        categorie: "Arbuste",
        nonTaxonomique: false,
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/Closeup_of_blackthorn_aka_sloe_aka_prunus_spinosa_sweden_20050924.jpg/500px-Closeup_of_blackthorn_aka_sloe_aka_prunus_spinosa_sweden_20050924.jpg",
        liens: [],
        nbDistributions: 4,
        nbProjets: 1,
      },
    ],
  },

  // ── MALUS ────────────────────────────────────────────────────────────────────
  {
    id: "malus",
    nomScientifique: "Malus",
    nomCommun: "Pommier",
    niveau: "Genre",
    categorie: "Fruitier",
    nonTaxonomique: false,
    // Pommes (pomes) — fruit charnu à cœur avec loges, caractéristique du genre
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Purple_prince_crabapple_tree.JPG/500px-Purple_prince_crabapple_tree.JPG",
    liens: [],
    nbDistributions: 0,
    nbProjets: 0,
    children: [
      {
        id: "malus-domestica",
        nomScientifique: "Malus domestica",
        nomCommun: "Pommier cultivé",
        niveau: "Espèce",
        categorie: "Fruitier",
        nonTaxonomique: false,
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Red_Apple.jpg/500px-Red_Apple.jpg",
        liens: [{ source: "Wikipedia", url: "https://fr.wikipedia.org/wiki/Pommier_commun" }],
        nbDistributions: 18,
        nbProjets: 6,
        children: [
          {
            id: "malus-domestica-reinette",
            nomScientifique: "Malus domestica 'Reinette Grise du Canada'",
            nomCommun: "Reinette Grise du Canada",
            niveau: "Variété/Cultivar",
            categorie: "Fruitier",
            nonTaxonomique: false,
            liens: [],
            nbDistributions: 6,
            nbProjets: 2,
          },
          {
            id: "malus-domestica-cox",
            nomScientifique: "Malus domestica 'Cox's Orange Pippin'",
            nomCommun: "Cox Orange",
            niveau: "Variété/Cultivar",
            categorie: "Fruitier",
            nonTaxonomique: false,
            liens: [],
            nbDistributions: 4,
            nbProjets: 1,
          },
        ],
      },
      {
        id: "malus-sylvestris",
        nomScientifique: "Malus sylvestris",
        nomCommun: "Pommier sauvage",
        niveau: "Espèce",
        categorie: "Fruitier",
        nonTaxonomique: false,
        liens: [],
        nbDistributions: 2,
        nbProjets: 1,
      },
    ],
  },

  // ── HEDERA ───────────────────────────────────────────────────────────────────
  {
    id: "hedera",
    nomScientifique: "Hedera",
    nomCommun: "Lierre",
    niveau: "Genre",
    categorie: "Plante grimpante",
    nonTaxonomique: false,
    // Baies noires à maturité en ombelles — trait distinctif du genre
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Hedera_algeriensis_kz01.jpg/500px-Hedera_algeriensis_kz01.jpg",
    liens: [],
    nbDistributions: 0,
    nbProjets: 0,
    children: [
      {
        id: "hedera-helix",
        nomScientifique: "Hedera helix",
        nomCommun: "Lierre grimpant",
        niveau: "Espèce",
        categorie: "Plante grimpante",
        nonTaxonomique: false,
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Hedera_helix_Dover.jpg/500px-Hedera_helix_Dover.jpg",
        liens: [{ source: "Floriscope", url: "https://floriscope.io/hedera-helix" }],
        nbDistributions: 5,
        nbProjets: 2,
        children: [
          {
            id: "hedera-helix-baltica",
            nomScientifique: "Hedera helix 'Baltica'",
            nomCommun: "Lierre de Baltique",
            niveau: "Variété/Cultivar",
            categorie: "Plante grimpante",
            nonTaxonomique: false,
            liens: [],
            nbDistributions: 1,
            nbProjets: 0,
          },
        ],
      },
    ],
  },

  // ── LONICERA ─────────────────────────────────────────────────────────────────
  {
    id: "lonicera",
    nomScientifique: "Lonicera",
    nomCommun: "Chèvrefeuille",
    niveau: "Genre",
    categorie: "Plante grimpante",
    nonTaxonomique: false,
    // Fleurs tubulaires bicolores — signe de reconnaissance immédiate du genre
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Lonicera_caprifolium001.jpg/500px-Lonicera_caprifolium001.jpg",
    liens: [],
    nbDistributions: 0,
    nbProjets: 0,
    children: [
      {
        id: "lonicera-periclymenum",
        nomScientifique: "Lonicera periclymenum",
        nomCommun: "Chèvrefeuille des bois",
        niveau: "Espèce",
        categorie: "Plante grimpante",
        nonTaxonomique: false,
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/European_honeysuckle_800.jpg/500px-European_honeysuckle_800.jpg",
        liens: [],
        nbDistributions: 3,
        nbProjets: 1,
      },
    ],
  },

  // ── Non-taxonomique ───────────────────────────────────────────────────────────
  {
    id: "plante-grimpante-ni",
    nomScientifique: null,
    nomCommun: "Plante grimpante non identifiée",
    niveau: "Genre",
    categorie: "Plante grimpante",
    nonTaxonomique: true,
    liens: [],
    nbDistributions: 2,
    nbProjets: 0,
  },
];

export function flattenTaxons(nodes: Taxon[]): Taxon[] {
  return nodes.flatMap((n) => [n, ...(n.children ? flattenTaxons(n.children) : [])]);
}

export function findTaxonById(id: string, nodes: Taxon[] = taxons): Taxon | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findTaxonById(id, node.children);
      if (found) return found;
    }
  }
  return null;
}

export function findAncestors(
  id: string,
  nodes: Taxon[] = taxons,
  path: Taxon[] = [],
): Taxon[] | null {
  for (const node of nodes) {
    if (node.id === id) return path;
    if (node.children) {
      const result = findAncestors(id, node.children, [...path, node]);
      if (result !== null) return result;
    }
  }
  return null;
}
