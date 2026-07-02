"use client";

import dynamic from "next/dynamic";

// TaxonForm reads live parent options via useLiveQuery — same SSR
// constraint as the detail/edit views, so it needs ssr:false too.
const TaxonForm = dynamic(() => import("../_components/taxon-form").then((m) => m.TaxonForm), { ssr: false });

export default function NouveauTaxonPage() {
  return <TaxonForm mode="create" />;
}
