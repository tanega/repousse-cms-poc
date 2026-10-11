import type { ReactNode } from "react";

import { SidebarProvider } from "@/components/ui/sidebar";
import { requireRole } from "@/lib/auth/require-role";
import { getCurrentUserServer } from "@/server/current-user";

import { MailSidebar } from "./_components/mail-sidebar";

export default async function Layout({ children }: Readonly<{ children: ReactNode }>) {
  // Template leftover, superadmin only (see SuperadminOnlyLayout).
  requireRole(await getCurrentUserServer(), "superadmin");

  return (
    <div className="relative h-full">
      <SidebarProvider className="h-full min-h-0">
        <MailSidebar />
        <div className="size-full">{children}</div>
      </SidebarProvider>
    </div>
  );
}
