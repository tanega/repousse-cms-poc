import type { Reservation, WaitlistEntry } from "@/types/reservation";

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

export interface ReservationItemAttrs {
  stock_id: string;
  qty: number;
  taxon_id: string;
}

export async function createReservation(
  eventId: string,
  attrs: { slot_id: string; project_id: string; items: ReservationItemAttrs[] },
): Promise<Reservation> {
  const res = await authedFetch(`/api/v1/distributions/${eventId}/reservations`, {
    method: "POST",
    body: JSON.stringify({ reservation: { ...attrs, event_id: eventId } }),
  });
  const { data } = await res.json();
  return data;
}

export async function fetchMyReservation(eventId: string): Promise<Reservation | null> {
  const res = await authedFetch(`/api/v1/distributions/${eventId}/reservations/mine`);
  const { data } = await res.json();
  return data;
}

export async function cancelReservation(eventId: string, reservationId: string): Promise<Reservation> {
  const res = await authedFetch(`/api/v1/distributions/${eventId}/reservations/${reservationId}`, {
    method: "DELETE",
  });
  const { data } = await res.json();
  return data;
}

export async function fetchProjectReservations(projectId: string): Promise<Reservation[]> {
  const res = await authedFetch(`/api/v1/projects/${projectId}/distribution_reservations`);
  const { data } = await res.json();
  return data;
}

export async function fetchMyWaitlistEntries(eventId: string): Promise<WaitlistEntry[]> {
  const res = await authedFetch(`/api/v1/distributions/${eventId}/waitlist/mine`);
  const { data } = await res.json();
  return data;
}

export async function joinWaitlist(eventId: string, taxonId: string): Promise<WaitlistEntry> {
  const res = await authedFetch(`/api/v1/distributions/${eventId}/waitlist?taxon_id=${encodeURIComponent(taxonId)}`, {
    method: "POST",
  });
  const { data } = await res.json();
  return data;
}

export async function leaveWaitlist(eventId: string, taxonId: string): Promise<void> {
  await authedFetch(`/api/v1/distributions/${eventId}/waitlist?taxon_id=${encodeURIComponent(taxonId)}`, {
    method: "DELETE",
  });
}
