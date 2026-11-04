import type { ReactNode } from "react";

import Image from "next/image";

import { Separator } from "@/components/ui/separator";

export default function Layout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <main>
      <div className="grid h-dvh justify-center p-2 lg:grid-cols-2">
        <div className="relative order-2 hidden h-full flex-col rounded-3xl lg:flex" style={{ backgroundColor: "#caca40" }}>
          <div className="space-y-1 px-10 pt-10 text-foreground">
            <Image src="/img/repousse-logo.webp" alt="Repousse" width={40} height={40} className="size-10" />
            <h1 className="font-medium text-2xl">Association Repousse</h1>
            <p className="text-sm">Commun numérique pour une pépinière participative qui oeuvre dans la vraie vie!</p>
            <p className="text-sm">Votre session reste ouverte 14 jours sur cet appareil.</p>
          </div>

          <div className="flex min-h-0 flex-1 items-center justify-center px-10 py-4">
            <Image
              src="/img/baobab.jpeg"
              alt="Bienvenue sur Baobab, la plateforme des familles d'accueil et des adoptants"
              width={900}
              height={900}
              priority
              className="h-auto max-h-full w-full max-w-lg object-contain"
            />
          </div>

          <div className="flex w-full justify-between px-10 pb-10">
            <div className="flex-1 space-y-1 text-foreground">
              <h2 className="font-medium">Prêt à vous lancer ?</h2>
              <p className="text-sm">
                Si vous êtes adhérent de Repousse, vous avez du recevoir un courriel vous informant de la création de
                votre compte. Connectez-vous maintenant pour découvrir votre espace et la communauté Repousse
              </p>
            </div>
            <Separator orientation="vertical" className="mx-3 h-auto!" />
            <div className="flex-1 space-y-1 text-foreground">
              <h2 className="font-medium">Besoin d'aide ?</h2>
              <p className="text-sm">
                Si vous n'arrivez pas à vous connecter, que vous souhaitez supprimer votre compte ou que vous avez des
                questions sur la confidentialité de vos données, n'hésitez pas à nous contacter à aide(à)repousse.org
              </p>
            </div>
          </div>
        </div>
        <div className="relative order-1 flex h-full">{children}</div>
      </div>
    </main>
  );
}
