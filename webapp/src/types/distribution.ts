export type EventStatus = "draft" | "published" | "closed";

export interface DistributionEvent {
  id: string;
  title: string;
  description: string | null;
  general_contact: string | null;
  image_url: string | null;
  slug: string;
  status: EventStatus;
  published_at: string | null;
  reservations_count: number;
  inserted_at: string;
  updated_at: string;
}

export interface DistributionSlot {
  id: string;
  location_name: string;
  address: string | null;
  date: string;
  start_time: string;
  end_time: string;
  contact: string | null;
  event_id: string;
}

export interface DistributionStock {
  id: string;
  quantity: number | null;
  quantity_unknown: boolean;
  reserved_quantity: number;
  event_id: string;
  taxon_id: string;
}

export const EVENT_STATUSES: EventStatus[] = ["draft", "published", "closed"];

export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  draft: "Brouillon",
  published: "Publié",
  closed: "Clôturé",
};

export const EVENT_STATUS_COLORS: Record<EventStatus, string> = {
  draft: "bg-slate-100 text-slate-800 dark:bg-slate-800/50 dark:text-slate-300",
  published: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  closed: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
};

/**
 * Allowed forward transitions from a given status. There is no backend
 * `unpublish_event` — `publish_event/1` only guards `draft -> published`, so
 * "revert to draft" is intentionally absent here (unlike the old mock).
 */
export const EVENT_STATUS_TRANSITIONS: Record<EventStatus, EventStatus[]> = {
  draft: ["published"],
  published: ["closed"],
  closed: [],
};

export function findEventById(id: string, rows: DistributionEvent[]): DistributionEvent | null {
  return rows.find((r) => r.id === id) ?? null;
}

export function stockTotal(stocks: Pick<DistributionStock, "quantity" | "quantity_unknown">[]): number | null {
  if (stocks.some((s) => s.quantity_unknown)) return null;
  return stocks.reduce((sum, s) => sum + (s.quantity ?? 0), 0);
}
