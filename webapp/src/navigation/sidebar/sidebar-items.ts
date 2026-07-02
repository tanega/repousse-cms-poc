import {
  Calendar,
  ChartBar,
  CheckSquare,
  Kanban,
  LayoutDashboard,
  Leaf,
  ListTodo,
  Lock,
  type LucideIcon,
  MessageSquare,
  Package,
  TreePine,
  Users,
  UsersRound,
  Zap,
} from "lucide-react";

export type NavBadge = "new" | "soon";

export interface NavSubItem {
  id: string;
  title: string;
  url: string;
  icon?: LucideIcon;
  badge?: NavBadge;
  disabled?: boolean;
  newTab?: boolean;
}

interface NavItemBase {
  id: string;
  title: string;
  icon?: LucideIcon;
  badge?: NavBadge;
  disabled?: boolean;
  newTab?: boolean;
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
    label: "Dashboards",
    items: [
      {
        id: "default",
        title: "Default",
        url: "/dashboard/default",
        icon: LayoutDashboard,
      },
      {
        id: "crm",
        title: "CRM",
        url: "/dashboard/crm",
        icon: ChartBar,
      },
      {
        id: "productivity",
        title: "Productivity",
        url: "/dashboard/productivity",
        icon: ListTodo,
      },
    ],
  },
  {
    id: 2,
    label: "Coordination",
    items: [
      {
        id: "calendar",
        title: "Calendar",
        url: "/dashboard/calendar",
        icon: Calendar,
      },
      {
        id: "tasks",
        title: "Tasks",
        url: "/dashboard/tasks",
        icon: CheckSquare,
      },
      {
        id: "roles",
        title: "Roles",
        url: "/dashboard/roles",
        icon: Lock,
      },
    ],
  },
  {
    id: 3,
    label: "Administration",
    items: [
      {
        id: "admin-adherents",
        title: "Adhérents",
        url: "/admin/adherents",
        icon: UsersRound,
      },
      {
        id: "admin-especes",
        title: "Espèces végétales",
        url: "/admin/especes-vegetales",
        icon: Leaf,
      },
      {
        id: "admin-distributions",
        title: "Distributions",
        url: "/admin/distributions",
        icon: Package,
      },
      {
        id: "admin-projets",
        title: "Projets de plantation",
        url: "/admin/projets-plantation",
        icon: TreePine,
      },
      {
        id: "admin-automatisations",
        title: "Automatisations",
        url: "/admin/automatisations",
        icon: Zap,
      },
    ],
  },
  {
    id: 4,
    label: "Pages",
    items: [
      {
        id: "chat",
        title: "Chat",
        url: "/dashboard/chat",
        icon: MessageSquare,
      },
      {
        id: "kanban",
        title: "Kanban",
        url: "/dashboard/kanban",
        icon: Kanban,
      },
      {
        id: "dashboard",
        title: "Dashboard",
        url: "/dashboard/default",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    id: 5,
    label: "Legacy",
    items: [
      {
        id: "legacy-dashboards",
        title: "Dashboards",
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
