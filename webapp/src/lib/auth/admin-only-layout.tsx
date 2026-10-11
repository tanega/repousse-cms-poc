import type { ReactNode } from "react";

import { requireRole } from "@/lib/auth/require-role";
import { getCurrentUserServer } from "@/server/current-user";

/**
 * Shared guard for routes stricter than their parent layout's "member"
 * baseline (Tableaux de bord and /projets-plantation browsing). Re-exported as the default
 * export of each route's own layout.tsx.
 */
export async function AdminOnlyLayout({ children }: { children: ReactNode }) {
  requireRole(await getCurrentUserServer(), "admin");
  return children;
}

/**
 * Same guard, superadmin only: the Coordination, Pages and Legacy sidebar
 * sections are template leftovers kept for the superadmin account alone.
 */
export async function SuperadminOnlyLayout({ children }: { children: ReactNode }) {
  requireRole(await getCurrentUserServer(), "superadmin");
  return children;
}
