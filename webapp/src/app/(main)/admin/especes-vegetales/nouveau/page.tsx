"use client";

import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";

// TaxonForm reads live parent options via useLiveQuery — same SSR
// constraint as the detail/edit views, so it needs ssr:false too.
const TaxonForm = dynamic(() => import("../_components/taxon-form").then((m) => m.TaxonForm), { ssr: false });

export default function NouveauTaxonPage() {
  const searchParams = useSearchParams();
  const defaultParentId = searchParams.get("parentId") ?? undefined;
  return <TaxonForm mode="create" defaultParentId={defaultParentId} />;
}
