"use client";

import { notFound } from "next/navigation";

import { useLiveQuery } from "@tanstack/react-db";

import { projetPlantationCollection } from "./collection";
import { findProjetById } from "./data";
import { ProjetForm } from "./projet-form";

export function ProjetEditView({ id }: { id: string }) {
  const { data: projets } = useLiveQuery(projetPlantationCollection);
  const projet = findProjetById(id, projets ?? []);
  if (!projet) notFound();

  return (
    <ProjetForm
      mode="edit"
      projetId={projet.id}
      statut={projet.statut}
      defaultValues={{
        nom: projet.nom,
        description: projet.description,
        natureGestion: projet.natureGestion,
        adresse: projet.adresse,
        surfaceM2: projet.surfaceM2 === null ? "" : String(projet.surfaceM2),
        natureSol: projet.natureSol,
        especeIds: projet.especeIds,
      }}
    />
  );
}
