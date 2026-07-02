import type { ReactNode } from "react";

import Image from "next/image";

import { Separator } from "@/components/ui/separator";

export default function Layout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <main>
      <div className="grid h-dvh justify-center p-2 lg:grid-cols-2">
        <div
          className="relative order-2 hidden h-full rounded-3xl lg:flex"
          style={{ backgroundColor: "#caca40" }}
        >
          <div className="absolute top-10 space-y-1 px-10 text-foreground">
            <Image src="/img/repousse-logo.webp" alt="Repousse" width={40} height={40} className="size-10" />
            <h1 className="font-medium text-2xl">Association Repousse</h1>
            <p className="text-sm">
              Commun numérique pour une pépinière participative qui oeuvre dans la vraie vie!
            </p>
          </div>

          <div className="absolute bottom-10 flex w-full justify-between px-10">
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
                Si vous n'arrivez pas à vous connecter, que vous souhaitez supprier votre compte ou que vous avez des
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
