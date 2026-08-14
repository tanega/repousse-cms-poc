import { QueryClient } from "@tanstack/query-core";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { createCollection } from "@tanstack/react-db";

import { archiveProject, createProject, fetchProjects, type ProjectAttrs, updateProject } from "@/lib/api/projects";
import type { Project } from "@/types/project";

const queryClient = new QueryClient();

/** Optimistic drafts only ever set these — strip the rest before hitting the API. */
function toAttrs(p: Partial<Project>): ProjectAttrs {
  return {
    name: p.name,
    description: p.description,
    management_type: p.management_type,
    address: p.address,
    lat: p.lat,
    lng: p.lng,
    surface_m2: p.surface_m2,
    soil_type: p.soil_type,
    publication_status: p.publication_status,
    preferred_species: p.preferred_species?.map((s) => ({ taxon_id: s.taxon_id })),
  };
}

export const projectCollection = createCollection(
  queryCollectionOptions<Project>({
    queryKey: ["projects"],
    queryFn: fetchProjects,
    queryClient,
    getKey: (project) => project.id,
    onInsert: async ({ transaction }) => {
      await Promise.all(transaction.mutations.map((m) => createProject(toAttrs(m.modified))));
    },
    onUpdate: async ({ transaction }) => {
      await Promise.all(transaction.mutations.map((m) => updateProject(String(m.key), toAttrs(m.changes))));
    },
    onDelete: async ({ transaction }) => {
      await Promise.all(transaction.mutations.map((m) => archiveProject(String(m.key))));
    },
  }),
);
