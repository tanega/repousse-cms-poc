import type { LucideIcon } from "lucide-react";
import { Home, TreePine, Users } from "lucide-react";

import type { CurrentUser, ProfileType, UserRole, UserStatus } from "@/types/user";

export type AdherentRow = CurrentUser;

export function fullName(row: Pick<AdherentRow, "first_name" | "last_name">): string {
  return [row.first_name, row.last_name].filter(Boolean).join(" ").trim();
}

// Un compte membre n'implique pas forcément une adhésion payante en cours
// (voir Repousse.Accounts.User côté backend : `status` = modération du
// compte, `adhesion_active` = adhésion à jour pour l'année courante — les
// deux sont indépendants, d'où deux badges distincts dans le tableau).
export function isAdhesionActive(row: Pick<AdherentRow, "adhesion_active">): boolean {
  return row.adhesion_active;
}

export const profileTypeLabels: Record<ProfileType, string> = {
  volunteer: "Bénévole",
  adoptant: "Adoptant",
  host_family: "Famille d'accueil",
};

export const profileTypeMeta: Record<ProfileType, { className: string; icon: LucideIcon }> = {
  volunteer: { className: "text-muted-foreground", icon: Users },
  adoptant: { className: "text-emerald-600", icon: TreePine },
  host_family: { className: "text-sky-600", icon: Home },
};

export const roleLabels: Record<UserRole, string> = {
  member: "Membre",
  admin: "Admin",
  superadmin: "Superadmin",
};

export const roleBadgeMeta: Record<UserRole, string> = {
  member: "border-border bg-muted/50 text-muted-foreground",
  admin: "border-sky-500/20 bg-sky-500/10 text-sky-600 dark:text-sky-400",
  superadmin: "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400",
};

export const statusLabels: Record<UserStatus, string> = {
  active: "Actif",
  suspended: "Suspendu",
};

export const statusMeta: Record<UserStatus, { badgeClass: string; dotClass: string }> = {
  active: {
    badgeClass: "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    dotClass: "bg-emerald-500",
  },
  suspended: {
    badgeClass: "border-orange-500/20 bg-orange-500/10 text-orange-600 dark:text-orange-400",
    dotClass: "bg-orange-500",
  },
};

export const filters = {
  profileType: ["Tous", "volunteer", "adoptant", "host_family"] as const,
  status: ["Tous", "active", "suspended"] as const,
};
