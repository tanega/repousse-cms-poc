"use client";

import { use } from "react";

import dynamic from "next/dynamic";

// TanStack DB's useLiveQuery relies on useSyncExternalStore without a
// server snapshot — SSR crashes without ssr:false (same as especes-vegetales).
// ssr:false is only allowed from a Client Component, hence "use client" here.
const DistributionDetailView = dynamic(
  () => import("../_components/distribution-detail-view").then((m) => m.DistributionDetailView),
  { ssr: false },
);

export default function DistributionDetailPage({ params }: { params: Promise<{ distributionId: string }> }) {
  const { distributionId } = use(params);
  return <DistributionDetailView id={decodeURIComponent(distributionId)} />;
}
