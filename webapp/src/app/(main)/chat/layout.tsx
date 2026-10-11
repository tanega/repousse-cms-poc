import type { ReactNode } from "react";

import { SidebarProvider } from "@/components/ui/sidebar";
import { requireRole } from "@/lib/auth/require-role";
import { getCurrentUserServer } from "@/server/current-user";

import { ChatHeader } from "./_components/chat-header";
import { ChatSidebar } from "./_components/chat-sidebar";

export default async function Layout({ children }: Readonly<{ children: ReactNode }>) {
  // Template leftover, superadmin only (see SuperadminOnlyLayout).
  requireRole(await getCurrentUserServer(), "superadmin");

  return (
    <div className="[--header-height:calc(--spacing(14))]">
      <SidebarProvider className="flex flex-col">
        <ChatHeader />
        <div className="flex flex-1">
          <ChatSidebar />
          {children}
        </div>
      </SidebarProvider>
    </div>
  );
}
