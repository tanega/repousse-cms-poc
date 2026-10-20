"use client";

import dynamic from "next/dynamic";

// maplibre touches `window` on import — client-only, like the Carte dashboard.
const FamillesAccueilView = dynamic(
  () => import("./_components/familles-accueil-view").then((m) => m.FamillesAccueilView),
  { ssr: false },
);

export default function FamillesAccueilPage() {
  return <FamillesAccueilView />;
}
