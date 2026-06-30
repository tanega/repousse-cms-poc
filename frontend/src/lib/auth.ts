import { Hanko } from "@teamhanko/hanko-frontend-sdk";

const HANKO_API_URL = process.env.NEXT_PUBLIC_HANKO_API_URL ?? "http://localhost:8000";

let hankoInstance: Hanko | null = null;

export function getHanko(): Hanko {
  if (!hankoInstance) {
    hankoInstance = new Hanko(HANKO_API_URL);
  }
  return hankoInstance;
}

export async function getHankoUser() {
  try {
    const hanko = getHanko();
    return await hanko.user.getCurrent();
  } catch {
    return null;
  }
}

export async function logout() {
  const hanko = getHanko();
  await hanko.user.logout();
}

export { HANKO_API_URL };
