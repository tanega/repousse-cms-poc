"use client";

import { use } from "react";

import dynamic from "next/dynamic";

const ProjetEditView = dynamic(() => import("../../_components/projet-edit-view").then((m) => m.ProjetEditView), {
  ssr: false,
});

export default function ModifierProjetPage({ params }: { params: Promise<{ projetId: string }> }) {
  const { projetId } = use(params);
  return <ProjetEditView id={decodeURIComponent(projetId)} />;
}
