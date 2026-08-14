export type ManagementType = "individual" | "collective";

export type PublicationStatus = "private" | "public" | "unpublished";

export interface ProjectPreferredSpecies {
  id: string;
  project_id: string;
  taxon_id: string;
  inserted_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  management_type: ManagementType;
  address: string | null;
  lat: number | null;
  lng: number | null;
  surface_m2: number | null;
  soil_type: string | null;
  publication_status: PublicationStatus;
  published_at: string | null;
  archived_at: string | null;
  owner_id: string | null;
  cover_image_url: string | null;
  preferred_species: ProjectPreferredSpecies[];
  inserted_at: string;
  updated_at: string;
}

export const MANAGEMENT_TYPES: ManagementType[] = ["individual", "collective"];

export const MANAGEMENT_TYPE_LABELS: Record<ManagementType, string> = {
  individual: "Individuelle",
  collective: "Collective",
};

export const PUBLICATION_STATUSES: PublicationStatus[] = ["private", "public", "unpublished"];

export const PUBLICATION_STATUS_LABELS: Record<PublicationStatus, string> = {
  private: "Privé",
  public: "Public",
  unpublished: "Dépublié",
};

export const PUBLICATION_STATUS_COLORS: Record<PublicationStatus, string> = {
  private: "bg-slate-100 text-slate-800 dark:bg-slate-800/50 dark:text-slate-300",
  public: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  unpublished: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

/** Allowed forward/backward transitions from a given status (moderation-only "unpublished" not exposed here). */
export const PUBLICATION_STATUS_TRANSITIONS: Record<PublicationStatus, PublicationStatus[]> = {
  private: ["public"],
  public: ["private"],
  unpublished: [],
};

export function findProjectById(id: string, rows: Project[]): Project | null {
  return rows.find((r) => r.id === id) ?? null;
}
