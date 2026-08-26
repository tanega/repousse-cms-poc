"use client";

import { use } from "react";

import dynamic from "next/dynamic";

const AdherentEditView = dynamic(() => import("../../_components/adherent-edit-view").then((m) => m.AdherentEditView), {
  ssr: false,
});

export default function ModifierAdherentPage({ params }: { params: Promise<{ adherentId: string }> }) {
  const { adherentId } = use(params);
  return <AdherentEditView id={decodeURIComponent(adherentId)} />;
}
