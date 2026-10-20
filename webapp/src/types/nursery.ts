import type { Taxon } from "./taxon";
import { type TaxonRequest, taxonRequestLabel } from "./taxon-request";

export interface NurseryPlant {
  id: string;
  nursery_id: string;
  /** Null while the plant waits for an admin to add it to the reference list. */
  taxon_id: string | null;
  taxon_request_id: string | null;
  taxon_request: TaxonRequest | null;
  quantity: number;
  note: string | null;
}

export function isPendingPlant(plant: Pick<NurseryPlant, "taxon_id">): boolean {
  return plant.taxon_id === null;
}

/** Name to show for a nursery line: the taxon's, or the requested name while pending. */
export function plantDisplayName(plant: NurseryPlant, taxa: Pick<Taxon, "id" | "common_name">[]): string {
  if (plant.taxon_id) return taxa.find((t) => t.id === plant.taxon_id)?.common_name ?? "Espèce inconnue";
  return plant.taxon_request ? taxonRequestLabel(plant.taxon_request) : "Plante en attente";
}

export interface Nursery {
  id: string;
  user_id: string;
  name: string;
  notes: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  archived_at: string | null;
  plants: NurseryPlant[];
  inserted_at: string;
  updated_at: string;
}

/** Sent on create/update — `plants` is a full replace of the list. */
export interface NurseryAttrs {
  name: string;
  notes?: string | null;
  address?: string | null;
  lat?: number | null;
  lng?: number | null;
  plants: { taxon_id?: string | null; taxon_request_id?: string | null; quantity: number; note?: string | null }[];
}

/** Owner contact attached to each nursery by the coordinator listing. */
export interface NurseryOwner {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  /** E.164, from the owner's Famille d'accueil profile. */
  phone: string | null;
}

/** Shape returned by GET /admin/nurseries (coordinator view, private profiles included). */
export interface AdminNursery extends Nursery {
  owner: NurseryOwner | null;
}

/** Flattened shape returned by GET /dashboard/map/nurseries. */
export interface NurseryMapPoint {
  id: string;
  name: string;
  address: string | null;
  lat: number;
  lng: number;
  user_id: string;
  owner_first_name: string | null;
  owner_last_name: string | null;
}
