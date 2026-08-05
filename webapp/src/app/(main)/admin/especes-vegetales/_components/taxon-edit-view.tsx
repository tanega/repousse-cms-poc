"use client";

import { notFound } from "next/navigation";

import { useLiveQuery } from "@tanstack/react-db";

import { findTaxonById } from "@/types/taxon";

import { taxonCollection } from "./collection";
import { TaxonForm } from "./taxon-form";

export function TaxonEditView({ id }: { id: string }) {
  const { data: rows, isLoading } = useLiveQuery(taxonCollection);

  if (isLoading) return null;

  const taxon = findTaxonById(id, rows ?? []);
  if (!taxon) notFound();

  return <TaxonForm mode="edit" taxon={taxon} />;
}
