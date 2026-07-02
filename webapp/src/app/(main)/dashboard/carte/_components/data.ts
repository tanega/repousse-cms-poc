export interface PointDistribution {
  id: string; nom: string; commune: string; lat: number; lng: number;
  plantsDistribues: number; derniereDistribution: string; statut: "actif" | "archive";
}
export interface ProjetPlantation {
  id: string; nom: string; commune: string; lat: number; lng: number;
  plantsAssocies: number; surface: number; statut: "actif" | "en_cours" | "complete" | "archive"; adoptant: string;
}
export interface PointContact {
  id: string; nom: string; commune: string; lat: number; lng: number;
  type: "coordination" | "benevole_referent" | "partenaire"; description: string;
}
export interface StatsCommunale {
  commune: string; codePostal: string; lat: number; lng: number;
  plantsDistribues: number; projetsActifs: number; adherents: number;
}

export const pointsDistribution: PointDistribution[] = [
  { id: "d1", nom: "Jardin des Plantes — hall d'entrée", commune: "Nantes", lat: 47.2131, lng: -1.5534, plantsDistribues: 1840, derniereDistribution: "2025-04-12", statut: "actif" },
  { id: "d2", nom: "Maison de quartier Bellevue", commune: "Saint-Herblain", lat: 47.2188, lng: -1.6521, plantsDistribues: 620, derniereDistribution: "2025-03-22", statut: "actif" },
  { id: "d3", nom: "Salle polyvalente du bourg", commune: "Vertou", lat: 47.1711, lng: -1.4706, plantsDistribues: 410, derniereDistribution: "2025-02-15", statut: "actif" },
  { id: "d4", nom: "Centre culturel La Fleuriaye", commune: "Carquefou", lat: 47.2994, lng: -1.4912, plantsDistribues: 890, derniereDistribution: "2025-04-05", statut: "actif" },
  { id: "d5", nom: "Mairie annexe Sud", commune: "Rezé", lat: 47.1802, lng: -1.5488, plantsDistribues: 540, derniereDistribution: "2025-05-10", statut: "actif" },
  { id: "d6", nom: "Ancienne pépinière municipale", commune: "Orvault", lat: 47.2761, lng: -1.6245, plantsDistribues: 230, derniereDistribution: "2023-11-20", statut: "archive" },
];

export const projetsDePlantation: ProjetPlantation[] = [
  { id: "p1", nom: "Verger partagé Île de Nantes", commune: "Nantes", lat: 47.2042, lng: -1.5606, plantsAssocies: 320, surface: 1200, statut: "actif", adoptant: "Adoptant A." },
  { id: "p2", nom: "Haie bocagère — zone maraîchère", commune: "Basse-Goulaine", lat: 47.2072, lng: -1.4530, plantsAssocies: 580, surface: 4500, statut: "actif", adoptant: "Adoptant B." },
  { id: "p3", nom: "Jardin d'école élémentaire", commune: "Saint-Sébastien-sur-Loire", lat: 47.2039, lng: -1.5011, plantsAssocies: 45, surface: 200, statut: "complete", adoptant: "Adoptant C." },
  { id: "p4", nom: "Cour de résidence HLM Les Châtaigniers", commune: "Saint-Herblain", lat: 47.2141, lng: -1.6503, plantsAssocies: 90, surface: 350, statut: "en_cours", adoptant: "Adoptant D." },
  { id: "p5", nom: "Espace naturel bord d'Erdre", commune: "La Chapelle-sur-Erdre", lat: 47.3052, lng: -1.5581, plantsAssocies: 740, surface: 6000, statut: "actif", adoptant: "Commune de La Chapelle-sur-Erdre" },
  { id: "p6", nom: "Parc privé — réhabilitation bocagère", commune: "Bouguenais", lat: 47.1594, lng: -1.6103, plantsAssocies: 210, surface: 1800, statut: "actif", adoptant: "Adoptant E." },
  { id: "p7", nom: "Verger collectif bord de Loire", commune: "Thouaré-sur-Loire", lat: 47.2631, lng: -1.4353, plantsAssocies: 180, surface: 900, statut: "actif", adoptant: "Association partenaire" },
  { id: "p8", nom: "Haie de clôture — lotissement", commune: "Couëron", lat: 47.2131, lng: -1.7214, plantsAssocies: 150, surface: 600, statut: "en_cours", adoptant: "Adoptant F." },
];

export const pointsContact: PointContact[] = [
  { id: "c1", nom: "Siège social Repousse", commune: "Nantes", lat: 47.2198, lng: -1.5536, type: "coordination", description: "Bureau de l'association — coordination régionale, Loire-Atlantique" },
  { id: "c2", nom: "Référente bénévole Nord Loire", commune: "La Chapelle-sur-Erdre", lat: 47.3078, lng: -1.5612, type: "benevole_referent", description: "Référente zone nord agglomération nantaise" },
  { id: "c3", nom: "Partenaire — CAUE 44", commune: "Nantes", lat: 47.2231, lng: -1.5481, type: "partenaire", description: "CAUE 44 — partenaire conseil architecture & paysage" },
  { id: "c4", nom: "Référent bénévole Sud Loire", commune: "Rezé", lat: 47.1783, lng: -1.5503, type: "benevole_referent", description: "Référent zone sud agglomération nantaise" },
  { id: "c5", nom: "Partenaire — Pays de la Loire Nature", commune: "Saint-Herblain", lat: 47.2209, lng: -1.6480, type: "partenaire", description: "Association régionale biodiversité — partenaire programme haies" },
];

export const statsCommunales: StatsCommunale[] = [
  { commune: "Nantes", codePostal: "44000", lat: 47.2184, lng: -1.5536, plantsDistribues: 2160, projetsActifs: 2, adherents: 142 },
  { commune: "Saint-Herblain", codePostal: "44800", lat: 47.2119, lng: -1.6494, plantsDistribues: 710, projetsActifs: 2, adherents: 47 },
  { commune: "Rezé", codePostal: "44400", lat: 47.1783, lng: -1.5503, plantsDistribues: 540, projetsActifs: 1, adherents: 38 },
  { commune: "Carquefou", codePostal: "44470", lat: 47.3008, lng: -1.4900, plantsDistribues: 890, projetsActifs: 1, adherents: 31 },
  { commune: "Vertou", codePostal: "44120", lat: 47.1711, lng: -1.4706, plantsDistribues: 410, projetsActifs: 0, adherents: 24 },
  { commune: "La Chapelle-sur-Erdre", codePostal: "44240", lat: 47.3069, lng: -1.5594, plantsDistribues: 740, projetsActifs: 1, adherents: 29 },
  { commune: "Basse-Goulaine", codePostal: "44115", lat: 47.2072, lng: -1.4530, plantsDistribues: 580, projetsActifs: 1, adherents: 22 },
  { commune: "Saint-Sébastien-sur-Loire", codePostal: "44230", lat: 47.2058, lng: -1.5011, plantsDistribues: 45, projetsActifs: 1, adherents: 18 },
  { commune: "Bouguenais", codePostal: "44340", lat: 47.1594, lng: -1.6103, plantsDistribues: 210, projetsActifs: 1, adherents: 14 },
  { commune: "Thouaré-sur-Loire", codePostal: "44470", lat: 47.2631, lng: -1.4353, plantsDistribues: 180, projetsActifs: 1, adherents: 12 },
  { commune: "Couëron", codePostal: "44220", lat: 47.2131, lng: -1.7228, plantsDistribues: 150, projetsActifs: 1, adherents: 10 },
  { commune: "Orvault", codePostal: "44700", lat: 47.2769, lng: -1.6258, plantsDistribues: 230, projetsActifs: 0, adherents: 16 },
];
