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

export interface HandoverItem {
  taxon_id: string;
  common_name: string | null;
  reserved_qty: number;
  distributed_qty: number | null;
}

export interface HandoverRow {
  id: string;
  status: "confirmed" | "cancelled" | "no_show" | "validated";
  project_id: string;
  user: { id: string; first_name: string | null; last_name: string | null; email: string };
  items: HandoverItem[];
}

export async function fetchHandovers(eventId: string): Promise<HandoverRow[]> {
  const res = await authedFetch(`/api/v1/distributions/${eventId}/handovers`);
  const { data } = await res.json();
  return data;
}

export async function recordHandover(
  eventId: string,
  reservationId: string,
  items: { taxon_id: string; quantity: number }[],
): Promise<void> {
  await authedFetch(`/api/v1/distributions/${eventId}/reservations/${reservationId}/handover`, {
    method: "POST",
    body: JSON.stringify({ handover: { items } }),
  });
}
