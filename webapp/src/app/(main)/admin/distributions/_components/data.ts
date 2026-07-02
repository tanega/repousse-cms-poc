export type StatutEvenement = "Brouillon" | "Publié" | "Clôturé";

export interface Creneau {
  id: string;
  lieu: string;
  date: string; // ISO date, e.g. "2026-10-18"
  heureDebut: string; // "09:00"
  heureFin: string; // "12:00"
  contact: string;
}

export interface StockEspece {
  taxonId: string;
  /** null = quantité inconnue (pas de limite affichée aux Adoptants) */
  quantite: number | null;
}

export interface DistributionEvent {
  id: string;
  intitule: string;
  description: string;
  contactGeneral: string;
  imageUrl?: string;
  statut: StatutEvenement;
  /** slug utilisé dans le lien permanent partageable */
  lienPermanent: string;
  creneaux: Creneau[];
  stock: StockEspece[];
  nbInscrits: number;
  createdAt: string;
}

export const STATUTS: StatutEvenement[] = ["Brouillon", "Publié", "Clôturé"];

export const STATUT_COLORS: Record<StatutEvenement, string> = {
  Brouillon: "bg-slate-100 text-slate-800 dark:bg-slate-800/50 dark:text-slate-300",
  Publié: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  Clôturé: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
};

/** Allowed forward/backward transitions from a given status. */
export const STATUT_TRANSITIONS: Record<StatutEvenement, StatutEvenement[]> = {
  Brouillon: ["Publié"],
  Publié: ["Brouillon", "Clôturé"],
  Clôturé: [],
};

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export const distributionEvents: DistributionEvent[] = [
  {
    id: "distrib-automne-2026",
    intitule: "Distribution d'automne 2026",
    description:
      "Grande distribution de plants d'arbres et arbustes locaux, en partenariat avec la mairie. Places limitées, réservation obligatoire.",
    contactGeneral: "distribution@repousse.org",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Quercus_robur_acorn_-_Keila.jpg/500px-Quercus_robur_acorn_-_Keila.jpg",
    statut: "Publié",
    lienPermanent: "distribution-automne-2026",
    creneaux: [
      {
        id: "creneau-1",
        lieu: "Jardin partagé du Fort",
        date: "2026-10-17",
        heureDebut: "09:00",
        heureFin: "12:00",
        contact: "Camille (06 12 34 56 78)",
      },
      {
        id: "creneau-2",
        lieu: "Jardin partagé du Fort",
        date: "2026-10-18",
        heureDebut: "14:00",
        heureFin: "17:00",
        contact: "Camille (06 12 34 56 78)",
      },
    ],
    stock: [
      { taxonId: "quercus-robur", quantite: 30 },
      { taxonId: "fagus-sylvatica", quantite: 20 },
      { taxonId: "corylus-avellana", quantite: null },
    ],
    nbInscrits: 18,
    createdAt: "2026-08-01",
  },
  {
    id: "distrib-printemps-2027",
    intitule: "Distribution de printemps 2027",
    description: "Distribution de fruitiers et petits fruits pour la saison de plantation printanière.",
    contactGeneral: "distribution@repousse.org",
    statut: "Brouillon",
    lienPermanent: "distribution-printemps-2027",
    creneaux: [
      {
        id: "creneau-3",
        lieu: "Verger municipal",
        date: "2027-03-14",
        heureDebut: "10:00",
        heureFin: "13:00",
        contact: "Amir (06 98 76 54 32)",
      },
    ],
    stock: [
      { taxonId: "malus-domestica", quantite: 15 },
      { taxonId: "prunus-avium", quantite: 10 },
    ],
    nbInscrits: 0,
    createdAt: "2026-12-05",
  },
  {
    id: "distrib-hiver-2025",
    intitule: "Distribution d'hiver 2025",
    description: "Session de distribution de haies champêtres pour la trame verte du quartier.",
    contactGeneral: "distribution@repousse.org",
    statut: "Clôturé",
    lienPermanent: "distribution-hiver-2025",
    creneaux: [
      {
        id: "creneau-4",
        lieu: "Ferme urbaine des Coteaux",
        date: "2025-12-06",
        heureDebut: "09:30",
        heureFin: "12:30",
        contact: "Léa (06 11 22 33 44)",
      },
    ],
    stock: [
      { taxonId: "cornus-sanguinea", quantite: 0 },
      { taxonId: "sambucus-nigra", quantite: 0 },
    ],
    nbInscrits: 24,
    createdAt: "2025-10-20",
  },
];

export function findEventById(id: string, rows: DistributionEvent[] = distributionEvents): DistributionEvent | null {
  return rows.find((r) => r.id === id) ?? null;
}

export function stockTotal(event: Pick<DistributionEvent, "stock">): number | null {
  if (event.stock.some((s) => s.quantite === null)) return null;
  return event.stock.reduce((sum, s) => sum + (s.quantite ?? 0), 0);
}
