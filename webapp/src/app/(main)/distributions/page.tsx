"use client";

import dynamic from "next/dynamic";

// TanStack DB's useLiveQuery relies on useSyncExternalStore without a
// server snapshot — SSR crashes without ssr:false (see CLAUDE.md TanStack DB section).
const DistributionsBrowse = dynamic(
  () => import("./_components/distributions-browse").then((m) => m.DistributionsBrowse),
  { ssr: false },
);

export default function DistributionsBrowsePage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-semibold text-2xl">Distributions</h1>
        <p className="mt-1 text-muted-foreground text-sm">
          Réservez votre créneau pour les prochaines distributions de végétaux.
        </p>
      </div>
      <DistributionsBrowse />
    </div>
  );
}
