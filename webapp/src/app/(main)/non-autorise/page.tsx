import Link from "next/link";

import { Lock } from "lucide-react";

import { APP_CONFIG } from "@/config/app-config";
import { hasMinRole } from "@/lib/auth/roles";
import { getCurrentUserServer } from "@/server/current-user";

export default async function Page() {
  const user = await getCurrentUserServer();
  let homeHref = "/auth/v2/login";
  if (user) {
    homeHref = hasMinRole(user.role, "admin") ? APP_CONFIG.defaultPath : "/dashboard/me";
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-md text-center">
        <Lock className="mx-auto size-12 text-primary" />
        <h1 className="mt-4 font-bold text-3xl tracking-tight sm:text-4xl">Accès non autorisé</h1>
        <p className="mt-4 text-muted-foreground">
          Vous n'avez pas la permission d'accéder à ce contenu. Contactez un administrateur si vous pensez qu'il s'agit
          d'une erreur.
        </p>
        <div className="mt-6">
          <Link
            href={homeHref}
            className="inline-flex items-center rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground text-sm shadow-xs transition-colors hover:bg-primary/90 focus:outline-hidden focus:ring-2 focus:ring-primary focus:ring-offset-2"
            prefetch={false}
          >
            Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
