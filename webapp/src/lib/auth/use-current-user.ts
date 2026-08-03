"use client";

import { useEffect } from "react";

import { useCurrentUserStore } from "@/stores/current-user/current-user-store";

export function useCurrentUser() {
  const user = useCurrentUserStore((s) => s.user);
  const status = useCurrentUserStore((s) => s.status);
  const error = useCurrentUserStore((s) => s.error);
  const load = useCurrentUserStore((s) => s.load);

  useEffect(() => {
    if (status === "idle") {
      void load();
    }
  }, [status, load]);

  return { user, isLoading: status === "loading" || status === "idle", error, refetch: load };
}
