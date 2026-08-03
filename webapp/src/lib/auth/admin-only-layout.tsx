import type { ReactNode } from "react";

import { requireRole } from "@/lib/auth/require-role";
import { getCurrentUserServer } from "@/server/current-user";

/**
 * Shared guard for routes stricter than their parent layout's "member"
 * baseline (Tableaux de bord, Coordination, Pages and Legacy sidebar
 * sections, plus /projets-plantation browsing). Re-exported as the default
 * export of each route's own layout.tsx.
 */
export async function AdminOnlyLayout({ children }: { children: ReactNode }) {
  requireRole(await getCurrentUserServer(), "admin");
  return children;
}
