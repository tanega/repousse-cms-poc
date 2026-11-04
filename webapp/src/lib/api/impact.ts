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

export interface ImpactSummary {
  trees_given: number;
  hedge_count: number;
  mean_survival_rate: number | null;
  tree_reports: number;
  estimated_kg: number | null;
  note: string;
}

export interface Hedge {
  id: string;
  name: string;
  length_m: number | null;
  survival_rate: number | null;
  planted_on: string | null;
  notes: string | null;
  taxon_id: string | null;
  common_name: string | null;
}

export interface Gift {
  id: string;
  quantity: number;
  note: string | null;
  planted_on: string | null;
  taxon_id: string;
  common_name: string | null;
}

export interface ImpactPayload {
  data: ImpactSummary;
  hedges: Hedge[];
  gifts: Gift[];
}

export async function fetchImpact(): Promise<ImpactPayload> {
  const res = await authedFetch("/api/v1/admin/impact");
  return res.json();
}

export async function createGift(attrs: { taxon_id: string; quantity: number; note?: string; planted_on?: string }): Promise<Gift> {
  const res = await authedFetch("/api/v1/admin/impact/gifts", {
    method: "POST",
    body: JSON.stringify({ gift: attrs }),
  });
  const { data } = await res.json();
  return data;
}

export async function createHedge(attrs: {
  name: string;
  length_m?: number | null;
  survival_rate?: number | null;
  planted_on?: string | null;
  notes?: string | null;
  taxon_id?: string | null;
}): Promise<Hedge> {
  const res = await authedFetch("/api/v1/admin/impact/hedges", {
    method: "POST",
    body: JSON.stringify({ hedge: attrs }),
  });
  const { data } = await res.json();
  return data;
}
