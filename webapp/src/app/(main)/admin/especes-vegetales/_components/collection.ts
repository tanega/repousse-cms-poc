import { QueryClient } from "@tanstack/query-core";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { createCollection } from "@tanstack/react-db";

import {
  createTaxon,
  deleteTaxon,
  fetchTaxa,
  fetchTaxonCategories,
  type TaxonAttrs,
  updateTaxon,
} from "@/lib/api/taxa";
import type { Taxon, TaxonCategory } from "@/types/taxon";

const queryClient = new QueryClient();

/** Optimistic drafts only ever set these — strip the rest before hitting the API. */
function toAttrs(t: Partial<Taxon>): TaxonAttrs {
  return {
    scientific_name: t.scientific_name,
    common_name: t.common_name,
    taxonomic_level: t.taxonomic_level,
    is_non_taxonomic: t.is_non_taxonomic,
    image_url: t.image_url,
    parent_id: t.parent_id,
    category_id: t.category_id,
    external_links: t.external_links?.map((l) => ({ source_name: l.source_name, url: l.url })),
  };
}

export const taxonCollection = createCollection(
  queryCollectionOptions<Taxon>({
    queryKey: ["taxa"],
    queryFn: fetchTaxa,
    queryClient,
    getKey: (taxon) => taxon.id,
    onInsert: async ({ transaction }) => {
      await Promise.all(transaction.mutations.map((m) => createTaxon(toAttrs(m.modified))));
    },
    onUpdate: async ({ transaction }) => {
      await Promise.all(transaction.mutations.map((m) => updateTaxon(String(m.key), toAttrs(m.changes))));
    },
    onDelete: async ({ transaction }) => {
      await Promise.all(transaction.mutations.map((m) => deleteTaxon(String(m.key))));
    },
  }),
);

/** Read-only — no admin UI for managing categories themselves yet, just consumed for select options/labels. */
export const taxonCategoryCollection = createCollection(
  queryCollectionOptions<TaxonCategory>({
    queryKey: ["taxon-categories"],
    queryFn: fetchTaxonCategories,
    queryClient,
    getKey: (category) => category.id,
  }),
);
