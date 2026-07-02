export interface ProjetPlantation {
  id: string;
  nom: string;
}

export interface CurrentMember {
  id: string;
  nom: string;
  email: string;
  projetsPlantation: ProjetPlantation[];
}

/**
 * Mock "logged-in Adoptant" — replace with the real session/profile once
 * EP-02 (Auth) and EP-03 (Profils) are wired. `projetsPlantation` stands in
 * for the member's adopted planting projects (EP-03 dependency): required
 * selection when reserving a distribution slot. Ids match the real
 * `ProjetPlantation` rows this member belongs to (EP-04), so a reservation
 * shows up under "Plants associés via distributions" on that project's
 * dashboard (US-PROJET-11).
 */
export const currentMember: CurrentMember = {
  id: "me",
  nom: "Camille Bernard",
  email: "camille.bernard@example.org",
  projetsPlantation: [
    { id: "verger-partage-coteaux", nom: "Verger partagé des Coteaux" },
    { id: "haie-champetre-jardin-fort", nom: "Haie champêtre du Jardin du Fort" },
  ],
};
