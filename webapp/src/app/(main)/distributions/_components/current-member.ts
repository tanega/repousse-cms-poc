export interface CurrentMember {
  id: string;
  nom: string;
  email: string;
}

/**
 * Mock "logged-in Adoptant" — replace with the real session/profile once
 * EP-02 (Auth) and EP-03 (Profils) are wired. The member's planting projects
 * are now looked up live from `projetPlantationCollection` by matching this
 * `email` against a project's `membres` (see `ProjetSelectOrCreate`), rather
 * than duplicated here.
 */
export const currentMember: CurrentMember = {
  id: "me",
  nom: "Camille Bernard",
  email: "camille.bernard@example.org",
};
