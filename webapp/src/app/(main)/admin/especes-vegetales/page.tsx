"use client";

import dynamic from "next/dynamic";

// TanStack DB's useLiveQuery relies on useSyncExternalStore without a
// server snapshot — SSR crashes without ssr:false (same as the maplibre map).
const Taxons = dynamic(() => import("./_components/taxons").then((m) => m.Taxons), { ssr: false });

export default function EspecesVégétalesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-semibold text-2xl">Espèces végétales</h1>
        <p className="mt-1 text-muted-foreground text-sm">
          Catalogue de référence des genres, espèces et variétés gérés par l'association.
        </p>
      </div>
      <Taxons />
    </div>
  );
}
