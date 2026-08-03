import type { UserRole } from "@/types/user";

const ROLE_ORDER: readonly UserRole[] = ["member", "admin", "superadmin"];

export function hasMinRole(role: UserRole, minRole: UserRole): boolean {
  return ROLE_ORDER.indexOf(role) >= ROLE_ORDER.indexOf(minRole);
}
