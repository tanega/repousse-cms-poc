export interface NurseryPlant {
  id: string;
  nursery_id: string;
  taxon_id: string;
  quantity: number;
  note: string | null;
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
  plants: { taxon_id: string; quantity: number; note?: string | null }[];
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
