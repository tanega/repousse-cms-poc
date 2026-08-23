import type { DistributionEvent, DistributionSlot, DistributionStock, EventStatus } from "@/types/distribution";

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

// ── Events ────────────────────────────────────────────────────────────────

export async function fetchEvents(): Promise<DistributionEvent[]> {
  const res = await authedFetch("/api/v1/admin/distributions");
  const { data } = await res.json();
  return data;
}

export async function fetchEvent(id: string): Promise<DistributionEvent> {
  const res = await authedFetch(`/api/v1/admin/distributions/${id}`);
  const { data } = await res.json();
  return data;
}

export interface EventAttrs {
  title?: string;
  description?: string | null;
  general_contact?: string | null;
}

export async function createEvent(attrs: EventAttrs): Promise<DistributionEvent> {
  const res = await authedFetch("/api/v1/admin/distributions", {
    method: "POST",
    body: JSON.stringify({ distribution: attrs }),
  });
  const { data } = await res.json();
  return data;
}

export async function updateEvent(id: string, attrs: EventAttrs): Promise<DistributionEvent> {
  const res = await authedFetch(`/api/v1/admin/distributions/${id}`, {
    method: "PUT",
    body: JSON.stringify({ distribution: attrs }),
  });
  const { data } = await res.json();
  return data;
}

export async function deleteEvent(id: string): Promise<void> {
  await authedFetch(`/api/v1/admin/distributions/${id}`, { method: "DELETE" });
}

export async function transitionEventStatus(id: string, status: EventStatus): Promise<DistributionEvent> {
  const action = status === "published" ? "publish" : "close";
  const res = await authedFetch(`/api/v1/admin/distributions/${id}/${action}`, { method: "POST" });
  const { data } = await res.json();
  return data;
}

export async function uploadEventCoverImage(id: string, file: File): Promise<DistributionEvent> {
  const token = getHankoToken();
  const formData = new FormData();
  formData.append("cover_image", file);

  const res = await fetch(`${API_URL}/api/v1/admin/distributions/${id}/cover_image`, {
    method: "PATCH",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `Échec de l'upload (${res.status})`);
  }

  const { data } = await res.json();
  return data;
}

// ── Slots ─────────────────────────────────────────────────────────────────

export interface SlotAttrs {
  location_name?: string;
  address?: string | null;
  date?: string;
  start_time?: string;
  end_time?: string;
  contact?: string | null;
}

export async function fetchSlots(eventId: string): Promise<DistributionSlot[]> {
  const res = await authedFetch(`/api/v1/admin/distributions/${eventId}/slots`);
  const { data } = await res.json();
  return data;
}

export async function createSlot(eventId: string, attrs: SlotAttrs): Promise<DistributionSlot> {
  const res = await authedFetch(`/api/v1/admin/distributions/${eventId}/slots`, {
    method: "POST",
    body: JSON.stringify({ slot: attrs }),
  });
  const { data } = await res.json();
  return data;
}

export async function updateSlot(eventId: string, id: string, attrs: SlotAttrs): Promise<DistributionSlot> {
  const res = await authedFetch(`/api/v1/admin/distributions/${eventId}/slots/${id}`, {
    method: "PUT",
    body: JSON.stringify({ slot: attrs }),
  });
  const { data } = await res.json();
  return data;
}

export async function deleteSlot(eventId: string, id: string): Promise<void> {
  await authedFetch(`/api/v1/admin/distributions/${eventId}/slots/${id}`, { method: "DELETE" });
}

// ── Stocks ────────────────────────────────────────────────────────────────

export interface StockAttrs {
  quantity?: number | null;
  quantity_unknown?: boolean;
  taxon_id?: string;
}

export async function fetchStocks(eventId: string): Promise<DistributionStock[]> {
  const res = await authedFetch(`/api/v1/admin/distributions/${eventId}/stocks`);
  const { data } = await res.json();
  return data;
}

export async function createStock(eventId: string, attrs: StockAttrs): Promise<DistributionStock> {
  const res = await authedFetch(`/api/v1/admin/distributions/${eventId}/stocks`, {
    method: "POST",
    body: JSON.stringify({ stock: attrs }),
  });
  const { data } = await res.json();
  return data;
}

export async function updateStock(eventId: string, id: string, attrs: StockAttrs): Promise<DistributionStock> {
  const res = await authedFetch(`/api/v1/admin/distributions/${eventId}/stocks/${id}`, {
    method: "PUT",
    body: JSON.stringify({ stock: attrs }),
  });
  const { data } = await res.json();
  return data;
}

export async function deleteStock(eventId: string, id: string): Promise<void> {
  await authedFetch(`/api/v1/admin/distributions/${eventId}/stocks/${id}`, { method: "DELETE" });
}

// ── Public (member-facing, non-admin) ───────────────────────────────────────
// Same JSON shapes as the admin endpoints above, but scoped to the plain
// `:authenticated` pipeline instead of `:admin` — any signed-in member can
// read them, not just admins.

export async function fetchPublicEvents(): Promise<DistributionEvent[]> {
  const res = await authedFetch("/api/v1/distributions");
  const { data } = await res.json();
  return data;
}

export async function fetchPublicEvent(id: string): Promise<DistributionEvent> {
  const res = await authedFetch(`/api/v1/distributions/${id}`);
  const { data } = await res.json();
  return data;
}

export async function fetchPublicSlots(eventId: string): Promise<DistributionSlot[]> {
  const res = await authedFetch(`/api/v1/distributions/${eventId}/slots`);
  const { data } = await res.json();
  return data;
}

export async function fetchPublicStocks(eventId: string): Promise<DistributionStock[]> {
  const res = await authedFetch(`/api/v1/distributions/${eventId}/stocks`);
  const { data } = await res.json();
  return data;
}
