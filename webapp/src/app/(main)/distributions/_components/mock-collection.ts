import { localOnlyCollectionOptions } from "@tanstack/db";
import { createCollection } from "@tanstack/react-db";

import { type DistributionEvent, distributionEvents } from "./mock-events";

/**
 * Dev-mode: local-only collection seeded with the static mock catalogue.
 * Member-facing distributions pages only — reservations wiring is a
 * separate, not-yet-scheduled task, so this stays mocked while the admin
 * side (`admin/distributions/_components/collection.ts`) is wired to the
 * real backend.
 */
export const distributionEventCollection = createCollection(
  localOnlyCollectionOptions<DistributionEvent>({
    getKey: (event) => event.id,
    initialData: distributionEvents,
  }),
);
