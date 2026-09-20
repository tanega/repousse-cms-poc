"use client";

import dynamic from "next/dynamic";

// TanStack DB's useLiveQuery relies on useSyncExternalStore without a
// server snapshot — SSR crashes without ssr:false (same as the maplibre map).
const MesNurseriesView = dynamic(() => import("./_components/mes-nurseries-view").then((m) => m.MesNurseriesView), {
  ssr: false,
});

export default function MesNurseriesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-semibold text-2xl">Mes nurseries</h1>
        <p className="mt-1 text-muted-foreground text-sm">
          Vos lieux de réserve et les jeunes plants que vous y conservez avant distribution.
        </p>
      </div>
      <MesNurseriesView />
    </div>
  );
}
