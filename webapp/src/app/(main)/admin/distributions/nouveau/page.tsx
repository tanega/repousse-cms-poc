"use client";

import dynamic from "next/dynamic";

const DistributionForm = dynamic(() => import("../_components/distribution-form").then((m) => m.DistributionForm), {
  ssr: false,
});

export default function NouvelEvenementPage() {
  return <DistributionForm mode="create" />;
}
