"use client";

import { register } from "@teamhanko/hanko-elements";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { HANKO_API_URL } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    register(HANKO_API_URL).catch(console.error);
  }, []);

  useEffect(() => {
    const handler = () => router.replace("/dashboard");
    document.addEventListener("hankoAuthSuccess", handler);
    return () => document.removeEventListener("hankoAuthSuccess", handler);
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Repousse</h1>
          <p className="text-muted-foreground mt-1 text-sm">Connexion à votre espace</p>
        </div>

        {/* @ts-expect-error — Hanko custom element */}
        <hanko-auth />

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
