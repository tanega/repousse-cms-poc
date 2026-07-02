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
 * selection when reserving a distribution slot.
 */
export const currentMember: CurrentMember = {
  id: "me",
  nom: "Camille Bernard",
  email: "camille.bernard@example.org",
  projetsPlantation: [
    { id: "projet-cour-ecole-jean-moulin", nom: "Cour d'école Jean Moulin" },
    { id: "projet-jardin-partage-fort", nom: "Jardin partagé du Fort" },
  ],
};
