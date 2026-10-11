import type { AdminTaxonRequest, TaxonRequest, TaxonRequestAttrs, TaxonRequestStatus } from "@/types/taxon-request";

import type { TaxonAttrs } from "./taxa";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

export const TAXON_REQUESTS_CHANGED_EVENT = "taxon-requests:changed";

function getHankoToken(): string | undefined {
  if (typeof document === "undefined") return undefined;
  return document.cookie
    .split("; ")
    .find((entry) => entry.startsWith("hanko="))
    ?.split("=")[1];
}

async function authedFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = getHankoToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const details = body?.errors ? Object.values(body.errors).flat().join(", ") : null;
    throw new Error(details || body?.error || `Échec de la requête (${res.status})`);
  }

  return res;
}

/** Member side: ask for a plant to be added. An open request with the same name is returned as-is. */
export async function createTaxonRequest(attrs: TaxonRequestAttrs): Promise<TaxonRequest> {
  const res = await authedFetch("/api/v1/me/taxon_requests", {
    method: "POST",
    body: JSON.stringify({ taxon_request: attrs }),
  });
  const { data } = await res.json();
  return data;
}

export async function fetchTaxonRequests(status: TaxonRequestStatus = "pending"): Promise<AdminTaxonRequest[]> {
  const res = await authedFetch(`/api/v1/admin/taxon_requests?status=${status}`);
  const { data } = await res.json();
  return data;
}

export async function fetchPendingTaxonRequestCount(): Promise<number> {
  const res = await authedFetch("/api/v1/admin/taxon_requests/count");
  const { data } = await res.json();
  return data.pending_count;
}

/** Approve by creating `taxon`, or by linking an existing `taxonId`. */
export async function approveTaxonRequest(
  id: string,
  target: { taxon: TaxonAttrs } | { taxonId: string },
): Promise<AdminTaxonRequest> {
  const body = "taxon" in target ? { taxon: target.taxon } : { taxon_id: target.taxonId };
  const res = await authedFetch(`/api/v1/admin/taxon_requests/${id}/approve`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  const { data } = await res.json();
  return data;
}

export async function rejectTaxonRequest(id: string, reason?: string): Promise<AdminTaxonRequest> {
  const res = await authedFetch(`/api/v1/admin/taxon_requests/${id}/reject`, {
    method: "POST",
    body: JSON.stringify({ reason: reason?.trim() || undefined }),
  });
  const { data } = await res.json();
  return data;
}
