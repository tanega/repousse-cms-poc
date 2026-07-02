import { localOnlyCollectionOptions } from "@tanstack/db";
import { createCollection } from "@tanstack/react-db";

import { type Reservation, reservations } from "./reservations-data";

/**
 * Dev-mode: local-only collection, same pattern as the admin distributions
 * and taxa collections (see CLAUDE.md "TanStack DB" section). Swap for
 * `queryCollectionOptions` + real fetch/onInsert/onUpdate once the backend
 * reservations endpoint exists.
 */
export const reservationsCollection = createCollection(
  localOnlyCollectionOptions<Reservation>({
    getKey: (reservation) => reservation.id,
    initialData: reservations,
  }),
);
