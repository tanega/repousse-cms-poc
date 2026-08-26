"use client";

import { notFound } from "next/navigation";

import { useLiveQuery } from "@tanstack/react-db";

import { AdherentForm } from "./adherent-form";
import { adherentCollection } from "./collection";

export function AdherentEditView({ id }: { id: string }) {
  const { data: adherents } = useLiveQuery(adherentCollection);
  const adherent = (adherents ?? []).find((a) => a.id === id);
  if (!adherent) notFound();

  return (
    <AdherentForm
      mode="edit"
      adherentId={adherent.id}
      defaultValues={{
        firstName: adherent.first_name ?? "",
        lastName: adherent.last_name ?? "",
        email: adherent.email,
        status: adherent.status,
        membershipYear: adherent.membership_year ? `${adherent.membership_year}` : "",
        adhesionActive: adherent.adhesion_active,
      }}
    />
  );
}
