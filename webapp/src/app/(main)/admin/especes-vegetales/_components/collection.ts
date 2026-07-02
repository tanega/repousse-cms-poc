import { QueryClient } from "@tanstack/query-core";
import { createCollection } from "@tanstack/react-db";
import { queryCollectionOptions } from "@tanstack/query-db-collection";

import { taxons, type Taxon } from "./data";

/**
 * Dev-mode: queryFn resolves the static mock catalogue. Swap for a real
 * `fetch("/api/taxons")` once the backend endpoint exists — collection
 * consumers (useLiveQuery, insert/update/delete) don't change either way.
 */
const queryClient = new QueryClient();

export const taxonCollection = createCollection(
  queryCollectionOptions<Taxon>({
    queryKey: ["taxons"],
    queryFn: async () => taxons,
    queryClient,
    getKey: (taxon) => taxon.id,

    // No backend yet: mutations stay optimistic-only, never hit the network.
    onInsert: async () => ({ refetch: false }),
    onUpdate: async () => ({ refetch: false }),
    onDelete: async () => ({ refetch: false }),
  }),
);
