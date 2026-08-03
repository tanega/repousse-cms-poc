import type { ReactNode } from "react";

import { requireRole } from "@/lib/auth/require-role";
import { getCurrentUserServer } from "@/server/current-user";

/**
 * Shared guard for dashboard sub-routes stricter than the parent dashboard
 * layout's "member" baseline (Coordination/Pages/Legacy sidebar sections).
 * Re-exported as the default export of each route's own layout.tsx.
 */
export async function AdminOnlyLayout({ children }: { children: ReactNode }) {
  requireRole(await getCurrentUserServer(), "admin");
  return children;
}
