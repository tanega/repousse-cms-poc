"use client";

import { useEffect, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { register, Hanko } from "@teamhanko/hanko-elements";

const HANKO_API_URL = process.env.NEXT_PUBLIC_HANKO_API_URL ?? "http://localhost:8000";
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export default function LoginPage() {
  const router = useRouter();
  const [hanko, setHanko] = useState<Hanko>();
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => setHanko(new Hanko(HANKO_API_URL)), []);

  useEffect(() => {
    register(HANKO_API_URL).catch(console.error);
  }, []);

  const redirectAfterLogin = useCallback(async () => {
    try {
      const match = document.cookie.match(/(?:^|; )hanko=([^;]*)/);
      const token = match ? decodeURIComponent(match[1]) : null;
      const res = await fetch(`${API_URL}/api/v1/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (!res.ok) {
        await hanko?.user.logout();
        setAccessDenied(true);
        return;
      }

      const { data } = await res.json();
      const isAdmin = data.profiles?.some(
        (p: { profile_type: string }) => p.profile_type === "admin"
      );

      if (isAdmin) {
        router.replace("/dashboard");
      } else {
        await hanko?.user.logout();
        setAccessDenied(true);
      }
    } catch {
      setAccessDenied(true);
    }
  }, [hanko, router]);

  useEffect(
    () => hanko?.onSessionCreated(() => { redirectAfterLogin(); }),
    [hanko, redirectAfterLogin]
  );

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Repousse</h1>
          <p className="text-muted-foreground mt-1 text-sm">Connexion à votre espace</p>
        </div>

        {accessDenied ? (
          <div className="rounded-md border border-red-200 bg-red-50 p-4 text-center text-sm text-red-700">
            Accès refusé. Votre compte n&apos;a pas les droits d&apos;accès à l&apos;administration.
          </div>
        ) : (
          /* @ts-expect-error — Hanko custom element */
          <hanko-auth />
        )}

        <p className="text-center text-sm text-muted-foreground">
          Pas encore membre ?{" "}
          <a href="https://www.helloasso.com" target="_blank" rel="noopener noreferrer" className="underline">
            Adhérer à l&apos;association
          </a>
        </p>
      </div>
    </div>
  );
}
