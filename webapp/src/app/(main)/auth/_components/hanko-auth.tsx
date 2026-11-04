"use client";

import { useEffect } from "react";

import { register } from "@teamhanko/hanko-elements";

import { HANKO_LANG, hankoTranslations } from "@/lib/hanko-i18n";

const HANKO_API_URL = process.env.NEXT_PUBLIC_HANKO_API_URL ?? "";

export function HankoAuth({ onSessionCreated }: { onSessionCreated?: () => void }) {
  useEffect(() => {
    register(HANKO_API_URL, {
      translations: hankoTranslations,
      fallbackLanguage: HANKO_LANG,
      enablePasskeys: false,
      hidePasskeyButtonOnLogin: true,
    })
      .then(() => attachPasswordToggle())
      .catch(console.error);

    const handler = () => {
      if (onSessionCreated) {
        onSessionCreated();
      } else {
        window.location.href = "/membres/me";
      }
    };

    document.addEventListener("hanko-session-created", handler);

    return () => {
      document.removeEventListener("hanko-session-created", handler);
    };
  }, [onSessionCreated]);

  return (
    <hanko-auth
      lang={HANKO_LANG}
      style={{ ["--color" as string]: "#111111", ["--brand-color" as string]: "#111111" }}
    />
  );
}

function attachPasswordToggle() {
  const root = document.querySelector("hanko-auth")?.shadowRoot;
  if (!root) return;

  const reveal = () => {
    const skip = Array.from(root.querySelectorAll("button")).find((button) => button.textContent?.trim() === "Passer");
    if (skip && root.textContent?.includes("clé d'identification") && !skip.dataset.skipped) {
      skip.dataset.skipped = "1";
      skip.click();
    }

    root.querySelectorAll<HTMLInputElement>('input[type="password"]').forEach((input) => {
      if (input.dataset.peek) return;
      input.dataset.peek = "1";
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = "Afficher";
      button.style.marginLeft = "0.5rem";
      button.style.fontSize = "0.75rem";
      button.addEventListener("click", () => {
        const showing = input.type === "text";
        input.type = showing ? "password" : "text";
        button.textContent = showing ? "Afficher" : "Masquer";
      });
      input.insertAdjacentElement("afterend", button);
    });
  };

  reveal();
  new MutationObserver(reveal).observe(root, { childList: true, subtree: true });
}
