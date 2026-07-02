"use client";

import { use } from "react";

import dynamic from "next/dynamic";

// TanStack DB's useLiveQuery relies on useSyncExternalStore without a
// server snapshot — SSR crashes without ssr:false (see CLAUDE.md TanStack DB section).
// ssr:false is only allowed from a Client Component, hence "use client" here.
const DistributionMemberView = dynamic(
  () => import("../_components/distribution-member-view").then((m) => m.DistributionMemberView),
  { ssr: false },
);

export default function DistributionMemberPage({ params }: { params: Promise<{ lienPermanent: string }> }) {
  const { lienPermanent } = use(params);
  return <DistributionMemberView slug={decodeURIComponent(lienPermanent)} />;
}
