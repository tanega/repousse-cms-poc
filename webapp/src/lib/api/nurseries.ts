import type { Nursery, NurseryAttrs, NurseryMapPoint } from "@/types/nursery";

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
