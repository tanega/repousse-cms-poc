import { QueryClient } from "@tanstack/query-core";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { createCollection } from "@tanstack/react-db";

import { fetchMyNurseries } from "@/lib/api/nurseries";
import { fetchPublicTaxa } from "@/lib/api/taxa";
import type { Nursery } from "@/types/nursery";
import type { Taxon } from "@/types/taxon";

const queryClient = new QueryClient();

// Read-only: a nursery write is a full replace of its plant list, which maps
// badly onto per-row optimistic mutations. The view calls the API directly
// and refetches, so errors surface where the user triggered them.
export const nurseryCollection = createCollection(
  queryCollectionOptions<Nursery>({
    queryKey: ["my-nurseries"],
    queryFn: fetchMyNurseries,
    queryClient,
    getKey: (nursery) => nursery.id,
  }),
);

/** Read-only — the species picker needs names for the taxa a member can stock. */
export const taxonOptionsCollection = createCollection(
  queryCollectionOptions<Taxon>({
    queryKey: ["public-taxa"],
    queryFn: fetchPublicTaxa,
    queryClient,
    getKey: (taxon) => taxon.id,
  }),
);
