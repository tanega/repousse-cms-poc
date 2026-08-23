import { QueryClient } from "@tanstack/query-core";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { createCollection } from "@tanstack/react-db";

import { fetchPublicEvents, fetchPublicSlots, fetchPublicStocks } from "@/lib/api/distributions";
import type { DistributionEvent, DistributionSlot, DistributionStock } from "@/types/distribution";

export const queryClient = new QueryClient();

/**
 * Member-facing, read-only mirrors of the admin distributions collections
 * (`admin/distributions/_components/collection.ts`) — same shapes, but
 * backed by the plain `/api/v1/distributions` routes (any signed-in member)
 * instead of `/api/v1/admin/distributions` (admin role required). Reserving
 * or joining a waitlist changes stock/reservation counts server-side; the
 * member view invalidates these query keys afterwards rather than writing
 * optimistic mutations through this collection.
 */
export const distributionEventCollection = createCollection(
  queryCollectionOptions<DistributionEvent>({
    queryKey: ["public-distribution-events"],
    queryFn: fetchPublicEvents,
    queryClient,
    getKey: (event) => event.id,
  }),
);

export function createPublicSlotCollection(eventId: string) {
  return createCollection(
    queryCollectionOptions<DistributionSlot>({
      queryKey: ["public-distribution-slots", eventId],
      queryFn: () => fetchPublicSlots(eventId),
      queryClient,
      getKey: (slot) => slot.id,
    }),
  );
}

export function createPublicStockCollection(eventId: string) {
  return createCollection(
    queryCollectionOptions<DistributionStock>({
      queryKey: ["public-distribution-stocks", eventId],
      queryFn: () => fetchPublicStocks(eventId),
      queryClient,
      getKey: (stock) => stock.id,
    }),
  );
}
