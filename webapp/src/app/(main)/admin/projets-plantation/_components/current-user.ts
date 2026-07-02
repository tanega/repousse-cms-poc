import type { ProjetPlantation, RoleMembre } from "./data";

/**
 * Mock "logged-in Adoptant" — same identity as distributions'
 * `currentMember` (webapp/src/app/(main)/distributions/_components/current-member.ts).
 * Replace with the real session/profile once EP-02 (Auth) and EP-03
 * (Profils) are wired.
 */
export const CURRENT_USER = {
  nom: "Camille Bernard",
  email: "camille.bernard@example.org",
};

/** Membership role of the current user on a given project, or null if not a member. */
export function getCurrentUserRole(projet: Pick<ProjetPlantation, "membres">): RoleMembre | null {
  return projet.membres.find((m) => m.nom === CURRENT_USER.nom)?.role ?? null;
}
