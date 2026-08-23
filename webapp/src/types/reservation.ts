export type ReservationStatus = "confirmed" | "cancelled" | "no_show" | "validated";

export interface ReservationItem {
  id: string;
  reserved_qty: number;
  distributed_qty: number | null;
  reservation_id: string;
  stock_id: string;
  taxon_id: string;
  inserted_at: string;
  updated_at: string;
}

export interface Reservation {
  id: string;
  status: ReservationStatus;
  cancelled_at: string | null;
  validated_at: string | null;
  coordinator_note: string | null;
  user_id: string;
  slot_id: string;
  event_id: string;
  project_id: string;
  items: ReservationItem[];
  inserted_at: string;
  updated_at: string;
}

export type WaitlistStatus = "waiting" | "notified" | "expired" | "converted";

export interface WaitlistEntry {
  id: string;
  position: number;
  notified_at: string | null;
  notification_expires_at: string | null;
  status: WaitlistStatus;
  user_id: string;
  event_id: string;
  taxon_id: string;
  inserted_at: string;
  updated_at: string;
}
