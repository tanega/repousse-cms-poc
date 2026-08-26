"use client";

import dynamic from "next/dynamic";

// TanStack DB's useLiveQuery relies on useSyncExternalStore without a
// server snapshot — SSR crashes without ssr:false (same as especes-vegetales).
const RolesView = dynamic(() => import("./_components/roles-view").then((m) => m.RolesView), {
  ssr: false,
});

export default function RolesPage() {
  return <RolesView />;
}
