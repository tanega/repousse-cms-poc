"use client";

import { use } from "react";

import dynamic from "next/dynamic";

// TanStack DB's useLiveQuery relies on useSyncExternalStore without a
// server snapshot — SSR crashes without ssr:false (same as especes-vegetales).
// ssr:false is only allowed from a Client Component, hence "use client" here.
const ProjetDashboardView = dynamic(
  () => import("../_components/projet-dashboard-view").then((m) => m.ProjetDashboardView),
  { ssr: false },
);

export default function ProjetPlantationDashboardPage({ params }: { params: Promise<{ projetId: string }> }) {
  const { projetId } = use(params);
  return <ProjetDashboardView id={decodeURIComponent(projetId)} />;
}
