"use client";

import { Suspense, useEffect, useState } from "react";

import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchPendingTaxonRequestCount, TAXON_REQUESTS_CHANGED_EVENT } from "@/lib/api/taxon-requests";

import { TaxonRequestsPanel } from "./_components/taxon-requests-panel";

// TanStack DB's useLiveQuery relies on useSyncExternalStore without a
// server snapshot — SSR crashes without ssr:false (same as the maplibre map).
const Taxons = dynamic(() => import("./_components/taxons").then((m) => m.Taxons), { ssr: false });

function PageContent() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState(searchParams.get("tab") === "demandes" ? "demandes" : "catalogue");
  const [pending, setPending] = useState(0);

  useEffect(() => {
    const refresh = () => fetchPendingTaxonRequestCount().then(setPending, () => undefined);
    void refresh();
    window.addEventListener(TAXON_REQUESTS_CHANGED_EVENT, refresh);
    return () => window.removeEventListener(TAXON_REQUESTS_CHANGED_EVENT, refresh);
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-semibold text-2xl">Espèces végétales</h1>
        <p className="mt-1 text-muted-foreground text-sm">
          Catalogue de référence des genres, espèces et variétés gérés par l'association.
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="catalogue">Catalogue</TabsTrigger>
          <TabsTrigger value="demandes">
            Demandes d'ajout
            {pending > 0 && (
              <Badge data-testid="taxon-requests-count" className="ml-1.5 h-4 min-w-4 rounded-full px-1 text-[10px]">
                {pending}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="catalogue" className="mt-4">
          <Taxons />
        </TabsContent>
        <TabsContent value="demandes" className="mt-4">
          <TaxonRequestsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function EspecesVégétalesPage() {
  return (
    <Suspense>
      <PageContent />
    </Suspense>
  );
}
