import type { AppNotification } from "@/types/notification";

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

export async function fetchNotifications(): Promise<{ items: AppNotification[]; unreadCount: number }> {
  const res = await authedFetch("/api/v1/me/notifications");
  const { data, meta } = await res.json();
  return { items: data, unreadCount: meta?.unread_count ?? 0 };
}

export async function markNotificationRead(id: string): Promise<void> {
  await authedFetch(`/api/v1/me/notifications/${id}/read`, { method: "POST" });
}

export async function markAllNotificationsRead(): Promise<void> {
  await authedFetch("/api/v1/me/notifications/read_all", { method: "POST" });
}
