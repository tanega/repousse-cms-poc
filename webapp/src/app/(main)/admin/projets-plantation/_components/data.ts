export type NatureGestion = "Individuelle" | "Collective";

export type StatutPublication = "Privé" | "Public" | "Dépublié";

export type RoleMembre = "Administrateur" | "Éditeur" | "Lecteur";

export type TypeMedia = "Photo" | "Vidéo" | "PDF";

export type StatutInvitation = "En attente" | "Acceptée";

export interface Membre {
  id: string;
  nom: string;
  email: string;
  role: RoleMembre;
}

export interface Invitation {
  id: string;
  destinataire: string;
  role: RoleMembre;
  statut: StatutInvitation;
  envoyeeLe: string;
}

export interface Media {
  id: string;
  type: TypeMedia;
  url: string;
  titre?: string;
  ajouteLe: string;
}

export interface NoteJournal {
  id: string;
  contenu: string;
  auteurNom: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ProjetPlantation {
  id: string;
  nom: string;
  description: string;
  natureGestion: NatureGestion;
  adresse: string;
  lat: number | null;
  lng: number | null;
  surfaceM2: number | null;
  natureSol: string;
  especeIds: string[];
  statut: StatutPublication;
  motifDepublication?: string;
  createurNom: string;
  membres: Membre[];
  invitations: Invitation[];
  medias: Media[];
  journal: NoteJournal[];
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

export const ROLES_ASSIGNABLES: RoleMembre[] = ["Éditeur", "Lecteur"];

export const ROLE_COLORS: Record<RoleMembre, string> = {
  Administrateur: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  Éditeur: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  Lecteur: "bg-slate-100 text-slate-800 dark:bg-slate-800/50 dark:text-slate-300",
};

export const TYPES_MEDIA: TypeMedia[] = ["Photo", "Vidéo", "PDF"];

export const MAX_MEDIAS = 10;

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
    lat: 45.7296,
    lng: 4.8567,
    surfaceM2: 850,
    natureSol: "Argilo-calcaire, bien drainé",
    especeIds: ["malus-domestica", "prunus-domestica", "prunus-avium"],
    statut: "Public",
    createurNom: "Léa Fontaine",
    membres: [
      { id: "m1", nom: "Léa Fontaine", email: "lea.fontaine@example.org", role: "Administrateur" },
      { id: "m2", nom: "Camille Bernard", email: "camille.bernard@example.org", role: "Éditeur" },
      { id: "m3", nom: "Amir Belkacem", email: "amir.belkacem@example.org", role: "Lecteur" },
    ],
    invitations: [
      {
        id: "i1",
        destinataire: "julie.morel@example.org",
        role: "Lecteur",
        statut: "En attente",
        envoyeeLe: "2026-06-01",
      },
    ],
    medias: [
      {
        id: "med1",
        type: "Photo",
        url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Red_Apple.jpg/500px-Red_Apple.jpg",
        titre: "Premiers fruits du verger",
        ajouteLe: "2026-06-20",
      },
    ],
    journal: [
      {
        id: "j1",
        contenu: "Premiers plants mis en terre avec 12 bénévoles.",
        auteurNom: "Léa Fontaine",
        createdAt: "2026-02-20",
      },
      {
        id: "j2",
        contenu: "Arrosage renforcé suite à la canicule de juin.",
        auteurNom: "Camille Bernard",
        createdAt: "2026-06-15",
      },
    ],
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
    lat: 45.748,
    lng: 4.832,
    surfaceM2: 120,
    natureSol: "Limoneux",
    especeIds: ["cornus-sanguinea", "sambucus-nigra", "corylus-avellana"],
    statut: "Public",
    createurNom: "Camille Bernard",
    membres: [
      { id: "m4", nom: "Camille Bernard", email: "camille.bernard@example.org", role: "Administrateur" },
      { id: "m5", nom: "Léa Fontaine", email: "lea.fontaine@example.org", role: "Éditeur" },
    ],
    invitations: [],
    medias: [
      {
        id: "med2",
        type: "Photo",
        url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Cornus_sanguinea_Sturm39.jpg/500px-Cornus_sanguinea_Sturm39.jpg",
        titre: "Haie plantée",
        ajouteLe: "2026-03-10",
      },
    ],
    journal: [
      {
        id: "j3",
        contenu: "Plantation de 40 mètres linéaires de haie champêtre.",
        auteurNom: "Camille Bernard",
        createdAt: "2026-03-04",
      },
    ],
    createdAt: "2026-03-02",
    publishedAt: "2026-03-04",
  },
  {
    id: "arbres-fruitiers-jardin-camille",
    nom: "Petit verger d'Amir",
    description:
      "Plantation individuelle de quelques fruitiers dans un jardin privé, suivie dans le cadre de l'association.",
    natureGestion: "Individuelle",
    adresse: "8 rue des Tilleuls, 69007 Lyon",
    lat: 45.755,
    lng: 4.81,
    surfaceM2: 45,
    natureSol: "Sableux",
    especeIds: ["malus-domestica"],
    statut: "Privé",
    createurNom: "Amir Belkacem",
    membres: [{ id: "m6", nom: "Amir Belkacem", email: "amir.belkacem@example.org", role: "Administrateur" }],
    invitations: [],
    medias: [],
    journal: [],
    createdAt: "2026-05-20",
    publishedAt: null,
  },
];

export function findProjetById(id: string, rows: ProjetPlantation[] = projetsPlantation): ProjetPlantation | null {
  return rows.find((r) => r.id === id) ?? null;
}
