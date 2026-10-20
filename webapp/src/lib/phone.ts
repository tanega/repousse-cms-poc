/**
 * Phone numbers are stored E.164 by the API (`+33612345678`). French ones
 * read better in their national form; others are shown as stored.
 */
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return "";
  const fr = /^\+33([1-9])(\d{2})(\d{2})(\d{2})(\d{2})$/.exec(phone);
  return fr ? `0${fr[1]} ${fr[2]} ${fr[3]} ${fr[4]} ${fr[5]}` : phone;
}

/** Loose client-side check — the API normalizes and has the final say. */
export function isPlausiblePhone(value: string): boolean {
  const digits = value.replace(/[\s.\-()]/g, "");
  return /^(0[1-9]\d{8}|(\+|00)[1-9]\d{7,14})$/.test(digits);
}
