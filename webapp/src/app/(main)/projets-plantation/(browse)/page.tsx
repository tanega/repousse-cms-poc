"use client";

import dynamic from "next/dynamic";

// TanStack DB's useLiveQuery relies on useSyncExternalStore without a
// server snapshot — SSR crashes without ssr:false (same as especes-vegetales).
const ProjetsPlantationBrowse = dynamic(
  () => import("../_components/projets-plantation-browse").then((m) => m.ProjetsPlantationBrowse),
  { ssr: false },
);

export default function ProjetsPlantationPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-semibold text-2xl">Projets de plantation</h1>
        <p className="mt-1 text-muted-foreground text-sm">
          Découvrez les initiatives de plantation partagées par les membres de l'association.
        </p>
      </div>
      <ProjetsPlantationBrowse />
    </div>
  );
}
