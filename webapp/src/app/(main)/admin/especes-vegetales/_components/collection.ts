import { createCollection } from "@tanstack/react-db";
import { localOnlyCollectionOptions } from "@tanstack/db";

import { taxons, type Taxon } from "./data";

/**
 * Dev-mode: local-only collection seeded with the static mock catalogue.
 * Its loopback sync makes insert/update/delete permanent in memory (no
 * external source of truth to revert to), so the demo CRUD survives
 * navigation. Swap for `queryCollectionOptions` + real fetch/onInsert/
 * onUpdate/onDelete once the backend endpoint exists — useLiveQuery and
 * collection.insert/update/delete calls in consumers don't change.
 */
export const taxonCollection = createCollection(
  localOnlyCollectionOptions<Taxon>({
    getKey: (taxon) => taxon.id,
    initialData: taxons,
  }),
);
