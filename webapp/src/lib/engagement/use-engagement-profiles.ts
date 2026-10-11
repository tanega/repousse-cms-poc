"use client";

import { useCallback, useMemo, useState } from "react";

import { requestProfile, updateMyProfiles } from "@/lib/api/me";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { useCurrentUserStore } from "@/stores/current-user/current-user-store";
import type { ProfileStatus, ProfileType, UserProfile } from "@/types/user";

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

  const all = useMemo<UserProfile[]>(() => user?.profiles ?? [], [user]);

  // `profiles` only holds what the member really has: pending and rejected
  // requests unlock nothing, so consumers gating on `profiles` stay correct.
  const profiles = useMemo<EngagementProfileId[]>(
    () =>
      all
        .filter((p) => p.status === "active")
        .map((p) => TO_LABEL[p.profile_type])
        .filter(Boolean),
    [all],
  );

  const statusOf = useCallback(
    (profile: EngagementProfileId): ProfileStatus | null =>
      all.find((p) => p.profile_type === TO_PROFILE_TYPE[profile])?.status ?? null,
    [all],
  );

  const rejectionReasonOf = useCallback(
    (profile: EngagementProfileId): string | null =>
      all.find((p) => p.profile_type === TO_PROFILE_TYPE[profile])?.rejection_reason ?? null,
    [all],
  );

  const syncProfiles = useCallback((updated: UserProfile[]) => {
    const current = useCurrentUserStore.getState().user;
    if (current) useCurrentUserStore.getState().setUser({ ...current, profiles: updated });
  }, []);

  // The API takes the complete list, so removing sends every profile that
  // should stay (active or pending) rather than a delta.
  const remove = useCallback(
    async (profile: EngagementProfileId) => {
      setIsPending(true);
      try {
        const keep = all
          .filter((p) => p.status !== "rejected" && p.profile_type !== TO_PROFILE_TYPE[profile])
          .map((p) => p.profile_type);
        syncProfiles(await updateMyProfiles(keep));
      } finally {
        setIsPending(false);
      }
    },
    [all, syncProfiles],
  );

  /** "Rejoindre": creates a pending request (or activates Bénévole straight away). */
  const join = useCallback(
    async (profile: EngagementProfileId) => {
      setIsPending(true);
      try {
        const created = await requestProfile(TO_PROFILE_TYPE[profile]);
        syncProfiles([...all.filter((p) => p.id !== created.id && p.profile_type !== created.profile_type), created]);
      } finally {
        setIsPending(false);
      }
    },
    [all, syncProfiles],
  );

  const deactivate = useCallback(
    async (profile: EngagementProfileId) => {
      if (profiles.length <= 1 && profiles.includes(profile)) return; // au moins un profil requis
      await remove(profile);
    },
    [profiles, remove],
  );

  const cancelRequest = remove;

  const isActive = useCallback((profile: EngagementProfileId) => profiles.includes(profile), [profiles]);

  return {
    profiles,
    join,
    deactivate,
    cancelRequest,
    isActive,
    statusOf,
    rejectionReasonOf,
    hydrated: !isLoading,
    isPending,
  };
}
