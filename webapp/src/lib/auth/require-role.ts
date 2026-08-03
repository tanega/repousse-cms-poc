import { redirect } from "next/navigation";

import type { CurrentUser, UserRole } from "@/types/user";

import { hasMinRole } from "./roles";

/**
 * Server Component-only guard: redirects to login when there's no session,
 * or to /unauthorized when the session's role doesn't meet minRole.
 * Narrows the return type to non-null since redirect() never returns.
 */
export function requireRole(user: CurrentUser | null, minRole: UserRole): CurrentUser {
  if (!user) {
    redirect("/auth/v2/login");
  }
  if (!hasMinRole(user.role, minRole)) {
    redirect("/unauthorized");
  }
  return user;
}
