export type ReservationStatut = "Confirmée" | "ListeAttente" | "Annulée";

export interface LigneReservation {
  taxonId: string;
  quantite: number;
}

export interface Reservation {
  id: string;
  eventId: string;
  creneauId: string;
  adoptantId: string;
  adoptantNom: string;
  projetPlantationId: string;
  lignes: LigneReservation[];
  statut: ReservationStatut;
  createdAt: string;
}

export const reservations: Reservation[] = [];

/**
 * An Adoptant may hold at most one active *confirmed* pickup per event.
 * Waitlist entries (one per exhausted species) are additional and don't
 * count against this rule.
 */
export function findActiveReservation(eventId: string, adoptantId: string, rows: Reservation[]): Reservation | null {
  return rows.find((r) => r.eventId === eventId && r.adoptantId === adoptantId && r.statut === "Confirmée") ?? null;
}

const CANCEL_DEADLINE_HOURS = 48;

/** Cancellation is only allowed until 48h before the reserved créneau. */
export function canCancel(creneauDate: string, creneauHeureDebut: string, now: Date = new Date()): boolean {
  if (!creneauDate || !creneauHeureDebut) return true;
  const slotStart = new Date(`${creneauDate}T${creneauHeureDebut}`);
  const deadline = new Date(slotStart.getTime() - CANCEL_DEADLINE_HOURS * 60 * 60 * 1000);
  return now < deadline;
}
