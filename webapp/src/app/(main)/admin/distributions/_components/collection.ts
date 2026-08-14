import { QueryClient } from "@tanstack/query-core";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { createCollection } from "@tanstack/react-db";

import {
  createEvent,
  createSlot,
  createStock,
  deleteEvent,
  deleteSlot,
  deleteStock,
  type EventAttrs,
  fetchEvents,
  fetchSlots,
  fetchStocks,
  type SlotAttrs,
  type StockAttrs,
  transitionEventStatus,
  updateEvent,
  updateSlot,
  updateStock,
} from "@/lib/api/distributions";
import type { DistributionEvent, DistributionSlot, DistributionStock } from "@/types/distribution";

export const queryClient = new QueryClient();

/** Optimistic drafts only ever set these — strip the rest before hitting the API. */
function toEventAttrs(e: Partial<DistributionEvent>): EventAttrs {
  return {
    title: e.title,
    description: e.description,
    general_contact: e.general_contact,
  };
}

export const distributionEventCollection = createCollection(
  queryCollectionOptions<DistributionEvent>({
    queryKey: ["distribution-events"],
    queryFn: fetchEvents,
    queryClient,
    getKey: (event) => event.id,
    onInsert: async ({ transaction }) => {
      await Promise.all(transaction.mutations.map((m) => createEvent(toEventAttrs(m.modified))));
    },
    onUpdate: async ({ transaction }) => {
      await Promise.all(
        transaction.mutations.map((m) => {
          const changedKeys = Object.keys(m.changes);
          // Status buttons only ever touch `status` in isolation — route those
          // through the dedicated publish/close endpoints instead of a generic
          // PUT, since there's no generic "set status" attribute on the API.
          if (changedKeys.length === 1 && changedKeys[0] === "status") {
            return transitionEventStatus(String(m.key), (m.changes as Partial<DistributionEvent>).status!);
          }
          return updateEvent(String(m.key), toEventAttrs(m.changes));
        }),
      );
    },
    onDelete: async ({ transaction }) => {
      await Promise.all(transaction.mutations.map((m) => deleteEvent(String(m.key))));
    },
  }),
);

function toSlotAttrs(s: Partial<DistributionSlot>): SlotAttrs {
  return {
    location_name: s.location_name,
    address: s.address,
    date: s.date,
    start_time: s.start_time,
    end_time: s.end_time,
    contact: s.contact,
  };
}

/**
 * Slots are a real REST sub-resource of one event (own id, own CRUD
 * endpoints), not a field on the event — scope a collection per event id
 * rather than trying to fit them into a single global collection.
 */
export function createSlotCollection(eventId: string) {
  return createCollection(
    queryCollectionOptions<DistributionSlot>({
      queryKey: ["distribution-slots", eventId],
      queryFn: () => fetchSlots(eventId),
      queryClient,
      getKey: (slot) => slot.id,
      onInsert: async ({ transaction }) => {
        await Promise.all(transaction.mutations.map((m) => createSlot(eventId, toSlotAttrs(m.modified))));
      },
      onUpdate: async ({ transaction }) => {
        await Promise.all(transaction.mutations.map((m) => updateSlot(eventId, String(m.key), toSlotAttrs(m.changes))));
      },
      onDelete: async ({ transaction }) => {
        await Promise.all(transaction.mutations.map((m) => deleteSlot(eventId, String(m.key))));
      },
    }),
  );
}

function toStockAttrs(s: Partial<DistributionStock>): StockAttrs {
  return {
    quantity: s.quantity,
    quantity_unknown: s.quantity_unknown,
    taxon_id: s.taxon_id,
  };
}

export function createStockCollection(eventId: string) {
  return createCollection(
    queryCollectionOptions<DistributionStock>({
      queryKey: ["distribution-stocks", eventId],
      queryFn: () => fetchStocks(eventId),
      queryClient,
      getKey: (stock) => stock.id,
      onInsert: async ({ transaction }) => {
        await Promise.all(transaction.mutations.map((m) => createStock(eventId, toStockAttrs(m.modified))));
      },
      onUpdate: async ({ transaction }) => {
        await Promise.all(
          transaction.mutations.map((m) => updateStock(eventId, String(m.key), toStockAttrs(m.changes))),
        );
      },
      onDelete: async ({ transaction }) => {
        await Promise.all(transaction.mutations.map((m) => deleteStock(eventId, String(m.key))));
      },
    }),
  );
}
