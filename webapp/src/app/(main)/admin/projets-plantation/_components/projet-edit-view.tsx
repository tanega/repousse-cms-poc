"use client";

import { notFound } from "next/navigation";

import { useLiveQuery } from "@tanstack/react-db";

import { findProjectById } from "@/types/project";

import { projectCollection } from "./project-collection";
import { ProjetForm } from "./projet-form";

export function ProjetEditView({ id }: { id: string }) {
  const { data: projets, isLoading } = useLiveQuery(projectCollection);

  if (isLoading) return null;

  const projet = findProjectById(id, projets ?? []);
  if (!projet) notFound();

  return <ProjetForm mode="edit" projet={projet} />;
}
