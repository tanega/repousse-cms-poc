"use client";

import dynamic from "next/dynamic";

// TanStack DB's useLiveQuery relies on useSyncExternalStore without a
// server snapshot — SSR crashes without ssr:false (same as especes-vegetales).
const Projets = dynamic(() => import("./_components/projets").then((m) => m.Projets), {
  ssr: false,
});

export default function ProjetsDePlantationPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Projets de plantation</h1>
        <p className="mt-1 text-muted-foreground text-sm">
          Gestion et suivi des projets de plantation de l'association.
        </p>
      </div>
      <Projets />
    </div>
  );
}
