import { Globe } from "lucide-react";

import { APP_CONFIG } from "@/config/app-config";

import { HankoAuth } from "../../_components/hanko-auth";

export default function LoginV2() {
  return (
    <>
      <div className="mx-auto flex w-full flex-col justify-center space-y-8 sm:w-[400px]">
        <div className="space-y-2 text-center">
          <h1 className="font-medium text-3xl">Connexion</h1>
          <p className="text-muted-foreground text-sm">Accédez à votre espace Repousse.</p>
        </div>
        <HankoAuth />
      </div>

      <div className="absolute bottom-5 flex w-full justify-between px-10">
        <div className="text-sm">{APP_CONFIG.copyright}</div>
        <div className="flex items-center gap-1 text-sm">
          <Globe className="size-4 text-muted-foreground" />
          FR
        </div>
      </div>
    </>
  );
}
