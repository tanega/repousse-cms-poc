"use client";

import { use } from "react";

import dynamic from "next/dynamic";

// TanStack DB's useLiveQuery relies on useSyncExternalStore without a
// server snapshot — SSR crashes without ssr:false (same as the maplibre map).
// ssr:false is only allowed from a Client Component, hence "use client" here.
const TaxonDetailView = dynamic(
  () => import("../_components/taxon-detail-view").then((m) => m.TaxonDetailView),
  { ssr: false },
);

export default function TaxonDetailPage({
  params,
}: {
  params: Promise<{ especeId: string }>;
}) {
  const { especeId } = use(params);
  return <TaxonDetailView id={decodeURIComponent(especeId)} />;
}
