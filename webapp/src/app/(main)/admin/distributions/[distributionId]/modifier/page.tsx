"use client";

import { use } from "react";

import dynamic from "next/dynamic";

const DistributionEditView = dynamic(
  () => import("../../_components/distribution-edit-view").then((m) => m.DistributionEditView),
  { ssr: false },
);

export default function ModifierEvenementPage({ params }: { params: Promise<{ distributionId: string }> }) {
  const { distributionId } = use(params);
  return <DistributionEditView id={decodeURIComponent(distributionId)} />;
}
