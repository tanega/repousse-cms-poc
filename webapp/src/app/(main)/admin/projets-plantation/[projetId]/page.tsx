"use client";

import { use } from "react";

import dynamic from "next/dynamic";

// TanStack DB's useLiveQuery relies on useSyncExternalStore without a
// server snapshot — SSR crashes without ssr:false (same as especes-vegetales).
// ssr:false is only allowed from a Client Component, hence "use client" here.
const ProjetDetailView = dynamic(() => import("../_components/projet-detail-view").then((m) => m.ProjetDetailView), {
  ssr: false,
});

export default function ProjetDetailPage({ params }: { params: Promise<{ projetId: string }> }) {
  const { projetId } = use(params);
  return <ProjetDetailView id={decodeURIComponent(projetId)} />;
}
