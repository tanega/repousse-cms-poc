"use client";

import type { ReactNode } from "react";

import { useCurrentUser } from "@/lib/auth/use-current-user";

/** Renders its children for the superadmin account only (nothing while the user is loading). */
export function SuperadminOnly({ children }: { children: ReactNode }) {
  const { user } = useCurrentUser();
  return user?.role === "superadmin" ? children : null;
}
