"use client";

import dynamic from "next/dynamic";

const ProjetForm = dynamic(() => import("../_components/projet-form").then((m) => m.ProjetForm), {
  ssr: false,
});

export default function NouveauProjetPage() {
  return <ProjetForm mode="create" />;
}
