"use client";

import { useEffect, useState } from "react";

function hasHankoCookie(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.split("; ").some((entry) => entry.startsWith("hanko="));
}

/**
 * Reads the `hanko` cookie client-side (see `hanko/config.yaml` — `http_only: false`).
 * It only proves a session cookie is present, not that the JWT is still valid;
 * good enough to decide whether to show the guest identity step on public forms.
 */
export function useHankoSession() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    setIsAuthenticated(hasHankoCookie());
  }, []);

  return { isAuthenticated };
}
