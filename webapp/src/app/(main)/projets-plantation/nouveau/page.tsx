"use client";

import dynamic from "next/dynamic";

// TanStack DB's useLiveQuery relies on useSyncExternalStore without a
// server snapshot — SSR crashes without ssr:false (same as especes-vegetales).
const ProjetPlantationPublicForm = dynamic(
  () => import("../_components/projet-plantation-public-form").then((m) => m.ProjetPlantationPublicForm),
  { ssr: false },
);

export default function NouveauProjetPlantationPage() {
  return <ProjetPlantationPublicForm />;
}
