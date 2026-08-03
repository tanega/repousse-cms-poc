"use client";

import { useCallback, useEffect, useState } from "react";

import { fetchCurrentUser } from "@/lib/api/me";
import type { CurrentUser } from "@/types/user";

export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchCurrentUser();
      setUser(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { user, isLoading, error, refetch };
}
