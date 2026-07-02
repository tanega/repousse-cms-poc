"use client";

import { useEffect } from "react";
import { register } from "@teamhanko/hanko-elements";

const HANKO_API_URL = process.env.NEXT_PUBLIC_HANKO_API_URL ?? "";

export function HankoAuth() {
  useEffect(() => {
    register(HANKO_API_URL).catch(console.error);

    const handler = () => {
      window.location.href = "/dashboard";
    };

    document.addEventListener("hanko-session-created", handler);

    return () => {
      document.removeEventListener("hanko-session-created", handler);
    };
  }, []);

  return <hanko-auth />;
}
