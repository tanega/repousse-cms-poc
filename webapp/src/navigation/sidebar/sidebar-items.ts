import {
  BookOpen,
  Calendar,
  ChartBar,
  CheckSquare,
  GraduationCap,
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
  TreePine,
  Users,
  UsersRound,
  Zap,
} from "lucide-react";

import type { UserRole } from "@/types/user";

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
    id: 1,
    label: "Tableaux de bord",
    items: [
      {
        id: "vie-associative",
        title: "Vie associative",
        url: "/dashboard/vie-associative",
        icon: Leaf,
      },
      {
        id: "carte",
        title: "Carte",
        url: "/dashboard/carte",
        icon: Map,
      },
      {
        id: "crm",
        title: "CRM",
        url: "/dashboard/crm",
        icon: ChartBar,
      },
      {
        id: "distributions",
        title: "Distributions",
        url: "/distributions",
        icon: Package,
      },
      {
        id: "projets-plantation",
        title: "Projets de plantation",
        url: "/projets-plantation",
        icon: TreePine,
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
        minRole: "admin",
      },
      {
        id: "admin-kanban",
        title: "Kanban",
        url: "/admin/kanban",
        icon: Kanban,
        minRole: "admin",
      },
      {
        id: "tasks",
        title: "Tâches",
        url: "/dashboard/tasks",
        icon: CheckSquare,
        minRole: "admin",
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
        minRole: "admin",
      },
      {
        id: "kanban",
        title: "Kanban",
        url: "/dashboard/kanban",
        icon: Kanban,
        minRole: "admin",
      },
      {
        id: "dashboard",
        title: "Dashboard",
        url: "/dashboard/default",
        icon: LayoutDashboard,
        minRole: "admin",
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
        minRole: "admin",
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
        minRole: "admin",
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
