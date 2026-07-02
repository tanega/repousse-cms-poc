"use client";

import { use } from "react";

import dynamic from "next/dynamic";

const TaxonEditView = dynamic(
  () => import("../../_components/taxon-edit-view").then((m) => m.TaxonEditView),
  { ssr: false },
);

export default function ModifierTaxonPage({
  params,
}: {
  params: Promise<{ especeId: string }>;
}) {
  const { especeId } = use(params);
  return <TaxonEditView id={decodeURIComponent(especeId)} />;
}
