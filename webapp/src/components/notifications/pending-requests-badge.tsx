"use client";

import { useEffect, useState } from "react";

import { SidebarMenuBadge } from "@/components/ui/sidebar";
import { fetchPendingProfileRequestCount, PROFILE_REQUESTS_CHANGED_EVENT } from "@/lib/api/profile-requests";
import { fetchPendingTaxonRequestCount, TAXON_REQUESTS_CHANGED_EVENT } from "@/lib/api/taxon-requests";

const POLL_INTERVAL_MS = 60_000;

function PendingCountBadge({
  fetchCount,
  changedEvent,
  testId,
}: {
  fetchCount: () => Promise<number>;
  changedEvent: string;
  testId: string;
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const refresh = () => fetchCount().then(setCount, () => undefined);
    void refresh();
    const timer = setInterval(refresh, POLL_INTERVAL_MS);
    window.addEventListener(changedEvent, refresh);
    return () => {
      clearInterval(timer);
      window.removeEventListener(changedEvent, refresh);
    };
  }, [fetchCount, changedEvent]);

  if (count === 0) return null;
  return <SidebarMenuBadge data-testid={testId}>{count}</SidebarMenuBadge>;
}

/** Profile requests awaiting an admin decision, shown next to the admin menu entry. */
export function PendingRequestsBadge() {
  return (
    <PendingCountBadge
      fetchCount={fetchPendingProfileRequestCount}
      changedEvent={PROFILE_REQUESTS_CHANGED_EVENT}
      testId="pending-requests-count"
    />
  );
}

/** Plant-addition requests awaiting a decision, shown next to "Espèces végétales". */
export function PendingTaxonRequestsBadge() {
  return (
    <PendingCountBadge
      fetchCount={fetchPendingTaxonRequestCount}
      changedEvent={TAXON_REQUESTS_CHANGED_EVENT}
      testId="pending-taxon-requests-count"
    />
  );
}
