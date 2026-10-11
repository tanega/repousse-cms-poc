import type { ProfileStatus, ProfileType } from "@/types/user";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

export const PROFILE_REQUESTS_CHANGED_EVENT = "profile-requests:changed";

export interface ProfileRequest {
  id: string;
  profile_type: ProfileType;
  status: ProfileStatus;
  requested_at: string | null;
  decided_at: string | null;
  rejection_reason: string | null;
  user: { id: string; first_name: string | null; last_name: string | null; email: string };
}

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

export async function fetchProfileRequests(status: ProfileStatus = "pending"): Promise<ProfileRequest[]> {
  const res = await authedFetch(`/api/v1/admin/profile_requests?status=${status}`);
  const { data } = await res.json();
  return data;
}

export async function fetchPendingProfileRequestCount(): Promise<number> {
  const res = await authedFetch("/api/v1/admin/profile_requests/count");
  const { data } = await res.json();
  return data.pending_count;
}

export async function approveProfileRequest(id: string): Promise<ProfileRequest> {
  const res = await authedFetch(`/api/v1/admin/profile_requests/${id}/approve`, { method: "POST" });
  const { data } = await res.json();
  return data;
}

export async function rejectProfileRequest(id: string, reason?: string): Promise<ProfileRequest> {
  const res = await authedFetch(`/api/v1/admin/profile_requests/${id}/reject`, {
    method: "POST",
    body: JSON.stringify({ reason: reason?.trim() || undefined }),
  });
  const { data } = await res.json();
  return data;
}
