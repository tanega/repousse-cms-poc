import { cookies } from "next/headers";

import type { CurrentUser } from "@/types/user";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

/**
 * Server Component-only lookup of the authenticated user, used where the
 * result gates rendering (e.g. the admin role guard) before anything is
 * sent to the client. Returns null on missing/invalid session — callers
 * decide whether that means redirect or anonymous rendering.
 */
export async function getCurrentUserServer(): Promise<CurrentUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("hanko")?.value;
  if (!token) return null;

  const res = await fetch(`${API_URL}/api/v1/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) return null;

  const { data } = await res.json();
  return data;
}
