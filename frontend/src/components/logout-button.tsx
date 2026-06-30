"use client";

import { useRouter } from "next/navigation";
import { Hanko } from "@teamhanko/hanko-elements";

const HANKO_API_URL = process.env.NEXT_PUBLIC_HANKO_API_URL ?? "http://localhost:8000";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    const hanko = new Hanko(HANKO_API_URL);
    await hanko.user.logout();
    router.replace("/auth/login");
  }

  return (
    <button
      onClick={handleLogout}
      className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
    >
      Se déconnecter
    </button>
  );
}
