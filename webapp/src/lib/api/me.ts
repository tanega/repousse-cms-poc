import type { CurrentUser } from "@/types/user";

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

export async function updateCurrentUser(attrs: {
  first_name?: string;
  last_name?: string;
}): Promise<CurrentUser> {
  const res = await authedFetch("/api/v1/me", {
    method: "PUT",
    body: JSON.stringify({ user: attrs }),
  });
  const { data } = await res.json();
  return data;
}
