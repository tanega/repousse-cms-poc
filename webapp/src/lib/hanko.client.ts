"use client";

import { Hanko } from "@teamhanko/hanko-elements";

const HANKO_API_URL = process.env.NEXT_PUBLIC_HANKO_API_URL ?? "";

export async function hankoLogout(): Promise<void> {
  const hanko = new Hanko(HANKO_API_URL);
  await hanko.logout();
  window.location.href = "/auth/v2/login";
}
