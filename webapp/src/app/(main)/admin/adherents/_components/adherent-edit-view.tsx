"use client";

import { notFound } from "next/navigation";

import { useLiveQuery } from "@tanstack/react-db";
import { format, parse } from "date-fns";

import { AdherentForm } from "./adherent-form";
import { adherentCollection } from "./collection";

export function AdherentEditView({ email }: { email: string }) {
  const { data: adherents } = useLiveQuery(adherentCollection);
  const adherent = (adherents ?? []).find((a) => a.email === email);
  if (!adherent) notFound();

  const [firstName, ...rest] = adherent.name.split(" ");
  const memberSince = format(parse(adherent.memberSince, "dd MMM yyyy, h:mm a", new Date()), "yyyy-MM-dd");

  return (
    <AdherentForm
      mode="edit"
      adherentEmail={adherent.email}
      defaultValues={{
        firstName,
        lastName: rest.join(" "),
        email: adherent.email,
        phone: adherent.phone ?? "",
        profileTypes: adherent.profileTypes,
        status: adherent.status,
        source: adherent.source,
        memberSince,
        notes: adherent.notes ?? "",
      }}
    />
  );
}
