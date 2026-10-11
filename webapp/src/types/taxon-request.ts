export type TaxonRequestStatus = "pending" | "approved" | "rejected";

/** A member's request to add a plant missing from the reference list. */
export interface TaxonRequest {
  id: string;
  common_name: string | null;
  scientific_name: string | null;
  category_id: string | null;
  comment: string | null;
  status: TaxonRequestStatus;
  taxon_id: string | null;
  decided_at: string | null;
  rejection_reason: string | null;
  inserted_at: string;
}

/** Admin listing: same request plus who asked and the category name. */
export interface AdminTaxonRequest extends TaxonRequest {
  category_name: string | null;
  requested_by: { id: string; first_name: string | null; last_name: string | null; email: string };
}

export interface TaxonRequestAttrs {
  common_name?: string;
  scientific_name?: string;
  category_id?: string | null;
  comment?: string;
}

export function taxonRequestLabel(request: Pick<TaxonRequest, "common_name" | "scientific_name">): string {
  return request.common_name ?? request.scientific_name ?? "Plante";
}
