"use client";

import dynamic from "next/dynamic";

import { ParcoursMembres } from "./_components/parcours-membres";

// TanStack DB's useLiveQuery relies on useSyncExternalStore without a
// server snapshot — SSR crashes without ssr:false (same as especes-vegetales).
const Adherents = dynamic(() => import("./_components/adherents").then((m) => m.Adherents), {
  ssr: false,
});

export default function MembresPage() {
  return (
    <div className="space-y-6">
      <ParcoursMembres />
      <Adherents />
    </div>
  );
}
