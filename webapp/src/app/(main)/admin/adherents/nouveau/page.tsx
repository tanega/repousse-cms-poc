"use client";

import dynamic from "next/dynamic";

const AdherentForm = dynamic(() => import("../_components/adherent-form").then((m) => m.AdherentForm), {
  ssr: false,
});

export default function NouvelAdherentPage() {
  return <AdherentForm mode="create" />;
}
