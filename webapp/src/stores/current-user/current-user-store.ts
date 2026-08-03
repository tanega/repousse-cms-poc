import { create } from "zustand";

import { fetchCurrentUser } from "@/lib/api/me";
import type { CurrentUser } from "@/types/user";

interface CurrentUserState {
  user: CurrentUser | null;
  status: "idle" | "loading" | "loaded" | "error";
  error: Error | null;
  setUser: (user: CurrentUser) => void;
  load: () => Promise<void>;
}

// Plain client-only global store (no Context/Provider, unlike
// stores/preferences/) — this data is never SSR-seeded, it's always fetched
// in the browser, so a single module-level store is safe and lets every
// consumer (sidebar, header, settings form) share one source of truth.
export const useCurrentUserStore = create<CurrentUserState>((set, get) => ({
  user: null,
  status: "idle",
  error: null,
  setUser: (user) => set({ user, status: "loaded", error: null }),
  load: async () => {
    if (get().status === "loading") return;
    set({ status: "loading" });
    try {
      const user = await fetchCurrentUser();
      set({ user, status: "loaded", error: null });
    } catch (err) {
      set({ status: "error", error: err instanceof Error ? err : new Error(String(err)) });
    }
  },
}));
