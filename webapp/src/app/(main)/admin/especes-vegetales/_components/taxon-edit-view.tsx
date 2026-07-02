"use client";

import { notFound } from "next/navigation";

import { useLiveQuery } from "@tanstack/react-db";

import { taxonCollection } from "./collection";
import { findTaxonById } from "./data";
import { TaxonForm } from "./taxon-form";

export function TaxonEditView({ id }: { id: string }) {
  const { data: rows, isLoading } = useLiveQuery(taxonCollection);

  if (isLoading) return null;

  const taxon = findTaxonById(id, rows ?? []);
  if (!taxon) notFound();

  return (
    <TaxonForm
      mode="edit"
      especeId={id}
      defaultValues={{
        nomCommun: taxon.nomCommun,
        nomScientifique: taxon.nomScientifique ?? "",
        niveau: taxon.niveau,
        categorie: taxon.categorie,
        parentId: taxon.parentId ?? "",
        nonTaxonomique: taxon.nonTaxonomique,
        imageUrl: taxon.imageUrl ?? "",
        liens: taxon.liens,
      }}
    />
  );
}
