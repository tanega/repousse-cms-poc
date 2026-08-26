import type { CurrentUser, UserRole, UserStatus } from "@/types/user";

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

export interface AdminUserAttrs {
  email?: string;
  first_name?: string;
  last_name?: string;
  status?: UserStatus;
  adhesion_active?: boolean;
  membership_year?: number;
}

export async function fetchAdminUsers(): Promise<CurrentUser[]> {
  const res = await authedFetch("/api/v1/admin/users");
  const { data } = await res.json();
  return data;
}

export async function fetchAdminUser(id: string): Promise<CurrentUser> {
  const res = await authedFetch(`/api/v1/admin/users/${id}`);
  const { data } = await res.json();
  return data;
}

/** New accounts are created without an elevated role — promote via `updateUserRole` (superadmin only, `/admin/roles`). */
export async function createAdminUser(attrs: AdminUserAttrs): Promise<CurrentUser> {
  const res = await authedFetch("/api/v1/admin/users", {
    method: "POST",
    body: JSON.stringify({ user: attrs }),
  });
  const { data } = await res.json();
  return data;
}

export async function updateAdminUser(id: string, attrs: AdminUserAttrs): Promise<CurrentUser> {
  const res = await authedFetch(`/api/v1/admin/users/${id}`, {
    method: "PUT",
    body: JSON.stringify({ user: attrs }),
  });
  const { data } = await res.json();
  return data;
}

export async function deleteAdminUser(id: string): Promise<void> {
  await authedFetch(`/api/v1/admin/users/${id}`, { method: "DELETE" });
}

export async function suspendAdminUser(id: string): Promise<CurrentUser> {
  const res = await authedFetch(`/api/v1/admin/users/${id}/suspend`, { method: "POST" });
  const { data } = await res.json();
  return data;
}

export async function activateAdminUser(id: string): Promise<CurrentUser> {
  const res = await authedFetch(`/api/v1/admin/users/${id}/activate`, { method: "POST" });
  const { data } = await res.json();
  return data;
}

/** Superadmin only — server enforces via `Repousse.Accounts.Policy :assign_role`. */
export async function updateUserRole(id: string, role: UserRole): Promise<CurrentUser> {
  const res = await authedFetch(`/api/v1/admin/users/${id}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
  const { data } = await res.json();
  return data;
}
