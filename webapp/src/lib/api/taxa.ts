import type { Taxon, TaxonCategory, TaxonomicLevel } from "@/types/taxon";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

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
    throw new Error(body?.error ?? `Échec de la requête (${res.status})`);
  }

  return res;
}

export async function fetchTaxa(): Promise<Taxon[]> {
  const res = await authedFetch("/api/v1/admin/taxa");
  const { data } = await res.json();
  return data;
}

export async function fetchTaxonCategories(): Promise<TaxonCategory[]> {
  const res = await authedFetch("/api/v1/taxa/categories");
  const { data } = await res.json();
  return data;
}

export interface TaxonAttrs {
  scientific_name?: string | null;
  common_name?: string;
  taxonomic_level?: TaxonomicLevel;
  is_non_taxonomic?: boolean;
  image_url?: string | null;
  parent_id?: string | null;
  category_id?: string | null;
  /** Full replace: sent on every create/update, mirrors the form's editable array. */
  external_links?: { source_name: string; url: string }[];
}

export async function createTaxon(attrs: TaxonAttrs): Promise<Taxon> {
  const res = await authedFetch("/api/v1/admin/taxa", {
    method: "POST",
    body: JSON.stringify({ taxon: attrs }),
  });
  const { data } = await res.json();
  return data;
}

export async function updateTaxon(id: string, attrs: TaxonAttrs): Promise<Taxon> {
  const res = await authedFetch(`/api/v1/admin/taxa/${id}`, {
    method: "PUT",
    body: JSON.stringify({ taxon: attrs }),
  });
  const { data } = await res.json();
  return data;
}

export async function deleteTaxon(id: string): Promise<void> {
  await authedFetch(`/api/v1/admin/taxa/${id}`, { method: "DELETE" });
}
