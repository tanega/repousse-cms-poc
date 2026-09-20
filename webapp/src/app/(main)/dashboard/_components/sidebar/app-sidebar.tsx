"use client";

import Link from "next/link";

import {
  CircleHelp,
  ClipboardList,
  Command,
  Database,
  File,
  Search,
  Settings,
} from "lucide-react";
import { useShallow } from "zustand/react/shallow";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { APP_CONFIG } from "@/config/app-config";
import { hasMinRole } from "@/lib/auth/roles";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import type { NavGroup } from "@/navigation/sidebar/sidebar-items";
import { sidebarItems } from "@/navigation/sidebar/sidebar-items";
import { usePreferencesStore } from "@/stores/preferences/preferences-provider";
import type { ProfileType, UserRole } from "@/types/user";

import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";

const _data = {
  navSecondary: [
    {
      title: "Settings",
      url: "#",
      icon: Settings,
    },
    {
      title: "Get Help",
      url: "#",
      icon: CircleHelp,
    },
    {
      title: "Search",
      url: "#",
      icon: Search,
    },
  ],
  documents: [
    {
      name: "Data Library",
      url: "#",
      icon: Database,
    },
    {
      name: "Reports",
      url: "#",
      icon: ClipboardList,
    },
    {
      name: "Word Assistant",
      url: "#",
      icon: File,
    },
  ],
};

// While the user's role and profiles haven't resolved yet, treat them as
// absent so gated items don't flash before being filtered out.
function filterByAccess(
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

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { sidebarVariant, sidebarCollapsible, isSynced } = usePreferencesStore(
    useShallow((s) => ({
      sidebarVariant: s.sidebarVariant,
      sidebarCollapsible: s.sidebarCollapsible,
      isSynced: s.isSynced,
    })),
  );
  const { user } = useCurrentUser();

  const variant = isSynced ? sidebarVariant : props.variant;
  const collapsible = isSynced ? sidebarCollapsible : props.collapsible;
  const visibleItems = filterByAccess(
    sidebarItems,
    user?.role,
    user?.profiles.map((p) => p.profile_type),
  );
  const homeHref = user && hasMinRole(user.role, "admin") ? APP_CONFIG.defaultPath : "/dashboard/me";

  const navUser = {
    name: user ? [user.first_name, user.last_name].filter(Boolean).join(" ") || user.email : "",
    email: user?.email ?? "",
    avatar: user?.avatar_url ?? "",
  };

  return (
    <Sidebar {...props} variant={variant} collapsible={collapsible}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link prefetch={false} href={homeHref}>
                <Command />
                <span className="font-semibold text-base">
                  {APP_CONFIG.name}
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={visibleItems} />
        {/* <NavDocuments items={data.documents} /> */}
        {/* <NavSecondary items={data.navSecondary} className="mt-auto" /> */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={navUser} />
      </SidebarFooter>
    </Sidebar>
  );
}
