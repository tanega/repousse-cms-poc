import { localOnlyCollectionOptions } from "@tanstack/db";
import { createCollection } from "@tanstack/react-db";

import { type ProjetPlantation, projetsPlantation } from "./data";

/**
 * Dev-mode: local-only collection seeded with the static mock catalogue.
 * The admin create/edit/list/detail pages now use the real backend via
 * `./project-collection` instead — this mock collection remains for the
 * other consumers not yet migrated (public projets-plantation browse pages,
 * the distributions feature's project picker, and the members/media/
 * journal/moderation detail cards).
 */
export const projetPlantationCollection = createCollection(
  localOnlyCollectionOptions<ProjetPlantation>({
    getKey: (projet) => projet.id,
    initialData: projetsPlantation,
  }),
);
