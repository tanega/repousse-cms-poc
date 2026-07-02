"use client";

import { notFound } from "next/navigation";

import { useLiveQuery } from "@tanstack/react-db";

import { distributionEventCollection } from "./collection";
import { findEventById } from "./data";
import { DistributionForm } from "./distribution-form";

export function DistributionEditView({ id }: { id: string }) {
  const { data: events } = useLiveQuery(distributionEventCollection);
  const event = findEventById(id, events ?? []);
  if (!event) notFound();

  return (
    <DistributionForm
      mode="edit"
      distributionId={event.id}
      statut={event.statut}
      defaultValues={{
        intitule: event.intitule,
        description: event.description,
        contactGeneral: event.contactGeneral,
        imageUrl: event.imageUrl ?? "",
        creneaux: event.creneaux,
        stock: event.stock,
      }}
    />
  );
}
