"use client";

import { useEffect, useState } from "react";

export type EngagementProfileId = "Bénévole" | "Adoptant" | "Famille d'accueil";

export const ALL_ENGAGEMENT_PROFILES: EngagementProfileId[] = [
  "Bénévole",
  "Adoptant",
  "Famille d'accueil",
];

const STORAGE_KEY = "repousse:engagement_profiles";
const DEFAULT: EngagementProfileId[] = ["Bénévole"];

export function useEngagementProfiles() {
  const [profiles, setProfiles] = useState<EngagementProfileId[]>(DEFAULT);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (
          Array.isArray(parsed) &&
          parsed.length > 0 &&
          parsed.every((p) => ALL_ENGAGEMENT_PROFILES.includes(p as EngagementProfileId))
        ) {
          setProfiles(parsed as EngagementProfileId[]);
        }
      }
    } catch {}
    setHydrated(true);
  }, []);

  function activate(profile: EngagementProfileId) {
    setProfiles((prev) => {
      if (prev.includes(profile)) return prev;
      const next = [...prev, profile];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }

  function deactivate(profile: EngagementProfileId) {
    setProfiles((prev) => {
      if (prev.length <= 1) return prev; // au moins un profil requis
      const next = prev.filter((p) => p !== profile);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }

  function isActive(profile: EngagementProfileId) {
    return profiles.includes(profile);
  }

  return { profiles, activate, deactivate, isActive, hydrated };
}
