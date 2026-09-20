"use client";

import { useCallback, useMemo, useState } from "react";

import { updateMyProfiles } from "@/lib/api/me";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { useCurrentUserStore } from "@/stores/current-user/current-user-store";
import type { ProfileType } from "@/types/user";

/** UI-facing identifiers. The API speaks `ProfileType`; these are the labels shown to members. */
export type EngagementProfileId = "Bénévole" | "Adoptant" | "Famille d'accueil";

export const ALL_ENGAGEMENT_PROFILES: EngagementProfileId[] = ["Bénévole", "Adoptant", "Famille d'accueil"];

const TO_PROFILE_TYPE: Record<EngagementProfileId, ProfileType> = {
  Bénévole: "volunteer",
  Adoptant: "adoptant",
  "Famille d'accueil": "host_family",
};

const TO_LABEL: Record<ProfileType, EngagementProfileId> = {
  volunteer: "Bénévole",
  adoptant: "Adoptant",
  host_family: "Famille d'accueil",
};

export function toProfileType(id: EngagementProfileId): ProfileType {
  return TO_PROFILE_TYPE[id];
}

export function toEngagementProfileId(type: ProfileType): EngagementProfileId {
  return TO_LABEL[type];
}

export function useEngagementProfiles() {
  const { user, isLoading } = useCurrentUser();
  const [isPending, setIsPending] = useState(false);

  const profiles = useMemo<EngagementProfileId[]>(
    () => (user?.profiles ?? []).map((p) => TO_LABEL[p.profile_type]).filter(Boolean),
    [user],
  );

  // The API takes the complete list, so both activate and deactivate send the
  // whole set rather than a delta.
  const replace = useCallback(async (next: EngagementProfileId[]) => {
    setIsPending(true);
    try {
      const updated = await updateMyProfiles(next.map(toProfileType));
      const current = useCurrentUserStore.getState().user;
      if (current) useCurrentUserStore.getState().setUser({ ...current, profiles: updated });
    } finally {
      setIsPending(false);
    }
  }, []);

  const activate = useCallback(
    async (profile: EngagementProfileId) => {
      if (profiles.includes(profile)) return;
      await replace([...profiles, profile]);
    },
    [profiles, replace],
  );

  const deactivate = useCallback(
    async (profile: EngagementProfileId) => {
      if (profiles.length <= 1) return; // au moins un profil requis
      await replace(profiles.filter((p) => p !== profile));
    },
    [profiles, replace],
  );

  const isActive = useCallback((profile: EngagementProfileId) => profiles.includes(profile), [profiles]);

  return { profiles, activate, deactivate, isActive, hydrated: !isLoading, isPending };
}
