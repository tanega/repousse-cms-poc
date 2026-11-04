import type { AdminNursery, Nursery, NurseryAttrs, NurseryMapPoint } from "@/types/nursery";

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

export async function fetchMyNurseries(): Promise<Nursery[]> {
  const res = await authedFetch("/api/v1/me/nurseries");
  const { data } = await res.json();
  return data;
}

export async function createNursery(attrs: NurseryAttrs): Promise<Nursery> {
  const res = await authedFetch("/api/v1/me/nurseries", {
    method: "POST",
    body: JSON.stringify({ nursery: attrs }),
  });
  const { data } = await res.json();
  return data;
}

export async function updateNursery(id: string, attrs: NurseryAttrs): Promise<Nursery> {
  const res = await authedFetch(`/api/v1/me/nurseries/${id}`, {
    method: "PUT",
    body: JSON.stringify({ nursery: attrs }),
  });
  const { data } = await res.json();
  return data;
}

export async function addNurseryPlant(nurseryId: string, taxonId: string, quantity: number): Promise<Nursery> {
  const res = await authedFetch(`/api/v1/me/nurseries/${nurseryId}/plants`, {
    method: "POST",
    body: JSON.stringify({ plant: { taxon_id: taxonId, quantity } }),
  });
  const { data } = await res.json();
  return data;
}

export async function removeNurseryPlant(nurseryId: string, plantId: string): Promise<Nursery> {
  const res = await authedFetch(`/api/v1/me/nurseries/${nurseryId}/plants/${plantId}`, { method: "DELETE" });
  const { data } = await res.json();
  return data;
}

export async function depositNurseryPlant(nurseryId: string, plantId: string): Promise<void> {
  await authedFetch(`/api/v1/me/nurseries/${nurseryId}/plants/${plantId}/deposit`, { method: "POST" });
}

export interface CleDesChampsDeposit {
  id: string;
  quantity: number;
  deposited_at: string;
  allocated_at: string | null;
  taxon_id: string;
  common_name: string | null;
  nursery_name: string | null;
  owner_name: string | null;
  owner_email: string | null;
}

export async function fetchMyDeposits(): Promise<CleDesChampsDeposit[]> {
  const res = await authedFetch("/api/v1/me/cle_des_champs");
  const { data } = await res.json();
  return data;
}

export async function fetchCleDesChamps(): Promise<{ data: CleDesChampsDeposit[]; archive: CleDesChampsDeposit[] }> {
  const res = await authedFetch("/api/v1/admin/cle_des_champs");
  const body = await res.json();
  return { data: body.data ?? [], archive: body.archive ?? [] };
}

export async function createDirectDeposit(taxonId: string, quantity: number): Promise<void> {
  await authedFetch("/api/v1/admin/cle_des_champs", {
    method: "POST",
    body: JSON.stringify({ deposit: { taxon_id: taxonId, quantity } }),
  });
}

export async function updateDepositQuantity(id: string, quantity: number): Promise<void> {
  await authedFetch(`/api/v1/admin/cle_des_champs/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ deposit: { quantity } }),
  });
}

export async function deleteDeposit(id: string): Promise<void> {
  await authedFetch(`/api/v1/admin/cle_des_champs/${id}`, { method: "DELETE" });
}

export async function searchAdoptants(query: string): Promise<{ id: string; first_name: string | null; last_name: string | null; projects: { id: string; name: string }[] }[]> {
  const res = await authedFetch(`/api/v1/adoptants?q=${encodeURIComponent(query)}`);
  const { data } = await res.json();
  return data;
}

export async function givePlantDirectly(nurseryId: string, plantId: string, projectId: string, quantity: number): Promise<void> {
  await authedFetch(`/api/v1/me/nurseries/${nurseryId}/plants/${plantId}/direct`, {
    method: "POST",
    body: JSON.stringify({ gift: { project_id: projectId, quantity } }),
  });
}

export async function allocateDepositsToEvent(eventId: string, depositIds?: string[]): Promise<void> {
  await authedFetch(`/api/v1/admin/distributions/${eventId}/stocks/from_cle_des_champs`, {
    method: "POST",
    body: JSON.stringify(depositIds ? { deposit_ids: depositIds } : {}),
  });
}

/** Soft-archives: the row stays for history, it just leaves the member's list. */
export async function archiveNursery(id: string): Promise<Nursery> {
  const res = await authedFetch(`/api/v1/me/nurseries/${id}`, { method: "DELETE" });
  const { data } = await res.json();
  return data;
}

export async function fetchNurseryMapPoints(): Promise<NurseryMapPoint[]> {
  const res = await authedFetch("/api/v1/dashboard/map/nurseries");
  const { data } = await res.json();
  return data;
}

/** Every member's non-archived nurseries with their owner's contact — admins only. */
export async function fetchAllNurseries(): Promise<AdminNursery[]> {
  const res = await authedFetch("/api/v1/admin/nurseries");
  const { data } = await res.json();
  return data;
}
