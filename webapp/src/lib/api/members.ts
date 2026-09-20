import type { Nursery } from "@/types/nursery";
import type { ProfileVisibility, UserProfile } from "@/types/user";

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

/** Deliberately narrower than CurrentUser — the API never sends another member's email. */
export interface MemberSummary {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  profile_visibility: ProfileVisibility;
  inserted_at: string;
}

export interface MemberProfile {
  user: MemberSummary;
  /** False when the viewer only gets the reduced payload (private profile, non-coordinator). */
  visible: boolean;
  profiles: UserProfile[];
  nurseries: Nursery[];
}

/** `id` accepts "me" for the current user. */
export async function fetchMemberProfile(id: string): Promise<MemberProfile> {
  const res = await authedFetch(`/api/v1/members/${id}`);
  const { data } = await res.json();
  return data;
}
