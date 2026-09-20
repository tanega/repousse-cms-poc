import type {
  CurrentUser,
  HostingEquipment,
  ProfileType,
  ProfileVisibility,
  UserProfile,
} from "@/types/user";

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

export async function fetchCurrentUser(): Promise<CurrentUser> {
  const res = await authedFetch("/api/v1/me");
  const { data } = await res.json();
  return data;
}

export async function updateCurrentUser(attrs: { first_name?: string; last_name?: string }): Promise<CurrentUser> {
  const res = await authedFetch("/api/v1/me", {
    method: "PUT",
    body: JSON.stringify({ user: attrs }),
  });
  const { data } = await res.json();
  return data;
}

/** Full replace: send every profile that should stay active, not just the delta. */
export async function updateMyProfiles(profiles: ProfileType[]): Promise<UserProfile[]> {
  const res = await authedFetch("/api/v1/me/profiles", {
    method: "PUT",
    body: JSON.stringify({ profiles }),
  });
  const { data } = await res.json();
  return data;
}

export interface HostFamilyAttrs {
  hosting_capacity?: number | null;
  hosting_surface_m2?: number | null;
  hosting_address?: string | null;
  hosting_lat?: number | null;
  hosting_lng?: number | null;
  hosting_availability?: string | null;
  hosting_equipment?: HostingEquipment[];
  hosted_species?: { taxon_id: string }[];
}

export async function updateHostFamilyProfile(attrs: HostFamilyAttrs): Promise<UserProfile> {
  const res = await authedFetch("/api/v1/me/profiles/host_family", {
    method: "PUT",
    body: JSON.stringify({ profile: attrs }),
  });
  const { data } = await res.json();
  return data;
}

export async function updateVisibility(visibility: ProfileVisibility): Promise<CurrentUser> {
  const res = await authedFetch("/api/v1/me/visibility", {
    method: "PUT",
    body: JSON.stringify({ profile_visibility: visibility }),
  });
  const { data } = await res.json();
  return data;
}

export async function uploadAvatar(file: File): Promise<CurrentUser> {
  const token = getHankoToken();
  const body = new FormData();
  body.append("avatar", file);

  const res = await fetch(`${API_URL}/api/v1/me/avatar`, {
    method: "PUT",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body,
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => null);
    throw new Error(errBody?.error ?? `Échec de l'upload (${res.status})`);
  }

  const { data } = await res.json();
  return data;
}
