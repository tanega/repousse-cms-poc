export type NatureGestion = "Individuelle" | "Collective";

export type StatutPublication = "Privé" | "Public" | "Dépublié";

export interface ProjetPlantation {
  id: string;
  nom: string;
  description: string;
  natureGestion: NatureGestion;
  adresse: string;
  surfaceM2: number | null;
  natureSol: string;
  especeIds: string[];
  statut: StatutPublication;
  createurNom: string;
  nbMembres: number;
  createdAt: string; // ISO date
  publishedAt: string | null;
}

export const NATURES_GESTION: NatureGestion[] = ["Individuelle", "Collective"];

export const STATUTS: StatutPublication[] = ["Privé", "Public", "Dépublié"];

export const STATUT_COLORS: Record<StatutPublication, string> = {
  Privé: "bg-slate-100 text-slate-800 dark:bg-slate-800/50 dark:text-slate-300",
  Public: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  Dépublié: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

/** Allowed forward/backward transitions from a given status (moderation-only Dépublié not exposed here). */
export const STATUT_TRANSITIONS: Record<StatutPublication, StatutPublication[]> = {
  Privé: ["Public"],
  Public: ["Privé"],
  Dépublié: [],
};

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export const projetsPlantation: ProjetPlantation[] = [
  {
    id: "verger-partage-coteaux",
    nom: "Verger partagé des Coteaux",
    description:
      "Plantation collective d'un verger conservatoire de variétés locales, ouvert aux habitants du quartier des Coteaux.",
    natureGestion: "Collective",
    adresse: "Ferme urbaine des Coteaux, 12 chemin des Coteaux, 69008 Lyon",
    surfaceM2: 850,
    natureSol: "Argilo-calcaire, bien drainé",
    especeIds: ["malus-domestica", "prunus-domestica", "prunus-avium"],
    statut: "Public",
    createurNom: "Léa Fontaine",
    nbMembres: 6,
    createdAt: "2026-02-10",
    publishedAt: "2026-02-15",
  },
  {
    id: "haie-champetre-jardin-fort",
    nom: "Haie champêtre du Jardin du Fort",
    description:
      "Restauration d'une haie champêtre en bordure du jardin partagé, pour favoriser la trame verte locale.",
    natureGestion: "Collective",
    adresse: "Jardin partagé du Fort, 3 rue du Fort, 69009 Lyon",
    surfaceM2: 120,
    natureSol: "Limoneux",
    especeIds: ["cornus-sanguinea", "sambucus-nigra", "corylus-avellana"],
    statut: "Public",
    createurNom: "Camille Nguyen",
    nbMembres: 4,
    createdAt: "2026-03-02",
    publishedAt: "2026-03-04",
  },
  {
    id: "arbres-fruitiers-jardin-camille",
    nom: "Petit verger de Camille",
    description:
      "Plantation individuelle de quelques fruitiers dans un jardin privé, suivie dans le cadre de l'association.",
    natureGestion: "Individuelle",
    adresse: "8 rue des Tilleuls, 69007 Lyon",
    surfaceM2: 45,
    natureSol: "Sableux",
    especeIds: ["malus-domestica"],
    statut: "Privé",
    createurNom: "Camille Nguyen",
    nbMembres: 1,
    createdAt: "2026-05-20",
    publishedAt: null,
  },
];

export function findProjetById(id: string, rows: ProjetPlantation[] = projetsPlantation): ProjetPlantation | null {
  return rows.find((r) => r.id === id) ?? null;
}
