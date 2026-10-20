import type { ReactNode } from "react";

import { requireRole } from "@/lib/auth/require-role";
import { getCurrentUserServer } from "@/server/current-user";

/**
 * Shared guard for routes kept for the superadmin account alone: the
 * Tableaux de bord (demo data only, until a dedicated dev role exists) and
 * the Coordination, Pages and Legacy sidebar sections (template leftovers).
 * Re-exported as the default export of each route's own layout.tsx.
 */
export async function SuperadminOnlyLayout({ children }: { children: ReactNode }) {
  requireRole(await getCurrentUserServer(), "superadmin");
  return children;
}
