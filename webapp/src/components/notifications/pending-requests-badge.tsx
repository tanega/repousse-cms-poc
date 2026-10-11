"use client";

import { useEffect, useState } from "react";

import { SidebarMenuBadge } from "@/components/ui/sidebar";
import { fetchPendingProfileRequestCount, PROFILE_REQUESTS_CHANGED_EVENT } from "@/lib/api/profile-requests";

const POLL_INTERVAL_MS = 60_000;

/** Count of profile requests awaiting an admin decision, shown next to the admin menu entry. */
export function PendingRequestsBadge() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const refresh = () => fetchPendingProfileRequestCount().then(setCount, () => undefined);
    void refresh();
    const timer = setInterval(refresh, POLL_INTERVAL_MS);
    window.addEventListener(PROFILE_REQUESTS_CHANGED_EVENT, refresh);
    return () => {
      clearInterval(timer);
      window.removeEventListener(PROFILE_REQUESTS_CHANGED_EVENT, refresh);
    };
  }, []);

  if (count === 0) return null;
  return <SidebarMenuBadge data-testid="pending-requests-count">{count}</SidebarMenuBadge>;
}
