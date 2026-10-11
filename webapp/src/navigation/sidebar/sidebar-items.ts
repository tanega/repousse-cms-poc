import {
  BookOpen,
  Calendar,
  ChartBar,
  CheckSquare,
  GraduationCap,
  Home,
  Kanban,
  LayoutDashboard,
  Leaf,
  Library,
  ListTodo,
  Lock,
  type LucideIcon,
  Map,
  MessageSquare,
  Package,
  Sprout,
  TreePine,
  UserCheck,
  Users,
  UsersRound,
  Zap,
} from "lucide-react";

import { hasMinRole } from "@/lib/auth/roles";
import type { ProfileType, UserRole } from "@/types/user";

export type NavBadge = "new" | "soon";

export interface NavSubItem {
  id: string;
  title: string;
  url: string;
  icon?: LucideIcon;
  badge?: NavBadge;
  disabled?: boolean;
  newTab?: boolean;
  /** Minimum role required to see this item. Omit for any authenticated user (member+). */
  minRole?: UserRole;
  /** Engagement profile required to see this item. Omit for every member. */
  requiresProfile?: ProfileType;
}

interface NavItemBase {
  id: string;
  title: string;
  icon?: LucideIcon;
  badge?: NavBadge;
  disabled?: boolean;
  newTab?: boolean;
  /** Minimum role required to see this item. Omit for any authenticated user (member+). */
  minRole?: UserRole;
  /** Engagement profile required to see this item. Omit for every member. */
  requiresProfile?: ProfileType;
}

export interface NavMainLinkItem extends NavItemBase {
  url: string;
  subItems?: never;
}

export interface NavMainParentItem extends NavItemBase {
  subItems: NavSubItem[];
}

export type NavMainItem = NavMainLinkItem | NavMainParentItem;

export interface NavGroup {
  id: number;
  label?: string;
  items: NavMainItem[];
}

export const sidebarItems: NavGroup[] = [
  {
    id: 0,
    label: "Mes ressources",
    items: [
      {
        id: "me",
        title: "Accueil",
        url: "/dashboard/me",
        icon: Home,
      },
      {
        id: "mes-nurseries",
        title: "Mes nurseries",
        url: "/mes-nurseries",
        icon: Sprout,
        requiresProfile: "host_family",
      },
    ],
  },
  {
    id: 1,
    label: "Tableaux de bord",
    items: [
      {
        id: "vie-associative",
        title: "Vie associative",
        url: "/dashboard/vie-associative",
        icon: Leaf,
        minRole: "admin",
      },
      {
        id: "carte",
        title: "Carte",
        url: "/dashboard/carte",
        icon: Map,
        minRole: "admin",
      },
      {
        id: "crm",
        title: "CRM",
        url: "/dashboard/crm",
        icon: ChartBar,
        minRole: "admin",
      },
      {
        id: "distributions",
        title: "Distributions",
        url: "/distributions",
        icon: Package,
        // /distributions itself stays a public guest-facing form (see
        // middleware PUBLIC_PATHS) — only the sidebar entry is hidden.
        minRole: "admin",
      },
      {
        id: "projets-plantation",
        title: "Projets de plantation",
        url: "/projets-plantation",
        icon: TreePine,
        minRole: "admin",
      },
    ],
  },
  {
    id: 2,
    label: "Coordination",
    items: [
      {
        id: "calendar",
        title: "Calendrier",
        url: "/dashboard/calendar",
        icon: Calendar,
        minRole: "superadmin",
      },
      {
        id: "admin-kanban",
        title: "Kanban",
        url: "/admin/kanban",
        icon: Kanban,
        minRole: "superadmin",
      },
      {
        id: "tasks",
        title: "Tâches",
        url: "/dashboard/tasks",
        icon: CheckSquare,
        minRole: "superadmin",
      },
    ],
  },
  {
    id: 3,
    label: "Administration",
    items: [
      {
        id: "admin-adherents",
        title: "Membres",
        url: "/admin/adherents",
        icon: UsersRound,
        minRole: "admin",
      },
      {
        id: "admin-demandes-parcours",
        title: "Demandes de parcours",
        url: "/admin/demandes-parcours",
        icon: UserCheck,
        minRole: "admin",
      },
      {
        id: "roles",
        title: "Rôles",
        url: "/admin/roles",
        icon: Lock,
        // Only superadmin can assign roles (Accounts.Policy :assign_role).
        minRole: "superadmin",
      },
      {
        id: "admin-especes",
        title: "Espèces végétales",
        url: "/admin/especes-vegetales",
        icon: Leaf,
        minRole: "admin",
      },
      {
        id: "admin-distributions",
        title: "Distributions",
        url: "/admin/distributions",
        icon: Package,
        minRole: "admin",
      },
      {
        id: "admin-projets",
        title: "Projets de plantation",
        url: "/admin/projets-plantation",
        icon: TreePine,
        minRole: "admin",
      },
      {
        id: "admin-automatisations",
        title: "Automatisations",
        url: "/admin/automatisations",
        icon: Zap,
        minRole: "admin",
      },
    ],
  },
  {
    id: 4,
    label: "Académie",
    items: [
      {
        id: "academie-guide",
        title: "Guide",
        url: "/academie/guide",
        icon: BookOpen,
      },
      {
        id: "academie-tutoriel",
        title: "Tutoriel",
        url: "/academie/tutoriel",
        icon: GraduationCap,
      },
      {
        id: "academie-encyclopedie",
        title: "Encyclopédie",
        url: "/academie/encyclopedie",
        icon: Library,
      },
    ],
  },
  {
    id: 5,
    label: "Pages",
    items: [
      {
        id: "chat",
        title: "Chat",
        url: "/dashboard/chat",
        icon: MessageSquare,
        minRole: "superadmin",
      },
      {
        id: "kanban",
        title: "Kanban",
        url: "/dashboard/kanban",
        icon: Kanban,
        minRole: "superadmin",
      },
      {
        id: "dashboard",
        title: "Dashboard",
        url: "/dashboard/default",
        icon: LayoutDashboard,
        minRole: "superadmin",
      },
    ],
  },
  {
    id: 6,
    label: "Legacy",
    items: [
      {
        id: "legacy-dashboards",
        title: "Dashboards",
        minRole: "superadmin",
        subItems: [
          {
            id: "legacy-default",
            title: "Default V1",
            url: "/dashboard/default-v1",
          },
          { id: "legacy-crm", title: "CRM V1", url: "/dashboard/crm-v1" },
          {
            id: "legacy-finance-v1",
            title: "Finance V1",
            url: "/dashboard/finance-v1",
          },
          {
            id: "legacy-analytics-v1",
            title: "Analytics V1",
            url: "/dashboard/analytics-v1",
          },
          { id: "legacy-finance", title: "Finance", url: "/dashboard/finance" },
          {
            id: "legacy-analytics",
            title: "Analytics",
            url: "/dashboard/analytics",
          },
          {
            id: "legacy-ecommerce",
            title: "E-commerce",
            url: "/dashboard/ecommerce",
          },
          { id: "legacy-academy", title: "Academy", url: "/dashboard/academy" },
          {
            id: "legacy-logistics",
            title: "Logistics",
            url: "/dashboard/logistics",
          },
          {
            id: "legacy-infrastructure",
            title: "Infrastructure",
            url: "/dashboard/infrastructure",
          },
        ],
      },
      {
        id: "legacy-pages",
        title: "Pages",
        minRole: "superadmin",
        subItems: [
          { id: "legacy-email", title: "Email", url: "/dashboard/mail" },
          { id: "legacy-invoice", title: "Invoice", url: "/dashboard/invoice" },
          {
            id: "users",
            title: "Users",
            url: "/dashboard/users",
            icon: Users,
          },
          {
            id: "legacy-auth-login-v1",
            title: "Login v1",
            url: "/auth/v1/login",
            newTab: true,
          },
          {
            id: "legacy-auth-login-v2",
            title: "Login v2",
            url: "/auth/v2/login",
            newTab: true,
          },
          {
            id: "legacy-auth-register-v1",
            title: "Register v1",
            url: "/auth/v1/register",
            newTab: true,
          },
          {
            id: "legacy-auth-register-v2",
            title: "Register v2",
            url: "/auth/v2/register",
            newTab: true,
          },
        ],
      },
    ],
  },
];

/**
 * Keeps the groups and items the user may see. While the role and profiles
 * haven't resolved yet they are treated as absent, so gated items don't flash
 * before being filtered out. Shared by the sidebar and the command palette.
 */
export function filterNavByAccess(
  groups: NavGroup[],
  role: UserRole | undefined,
  profiles: ProfileType[] | undefined,
): NavGroup[] {
  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) =>
          (!item.minRole || (role && hasMinRole(role, item.minRole))) &&
          (!item.requiresProfile || (profiles ?? []).includes(item.requiresProfile)),
      ),
    }))
    .filter((group) => group.items.length > 0);
}
