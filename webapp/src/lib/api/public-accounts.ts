const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

export type PublicAccountStatus = "created" | "existing";

export interface PublicAccountResult {
  status: PublicAccountStatus;
  id: string;
  email: string;
}

/**
 * Guest signup entry point (public distribution form). Backend finds an
 * existing account by email instead of creating a duplicate — the caller
 * should switch to a login step when `status: "existing"` comes back.
 */
export async function createOrCheckPublicAccount(params: {
  email: string;
  firstName?: string;
  lastName?: string;
}): Promise<PublicAccountResult> {
  const res = await fetch(`${API_URL}/api/v1/public/accounts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: params.email,
      first_name: params.firstName,
      last_name: params.lastName,
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `Échec de la création du compte (${res.status})`);
  }

  const { data } = await res.json();
  return data;
}
