import type { LucideIcon } from "lucide-react";
import { Home, ShieldCheck, TreePine, UserCheck, Users } from "lucide-react";

export type AdherentStatus = "Actif" | "En attente" | "Suspendu" | "Expiré";
export type AdherentProfileType =
  | "Bénévole"
  | "Adoptant"
  | "Famille d'accueil"
  | "Coordinateur"
  | "Administrateur";
export type AdherentSource = "HelloAsso" | "Manuel" | "Import CSV";

export type AdherentRow = {
  email: string;
  name: string;
  profileTypes: AdherentProfileType[]; // un utilisateur peut cumuler plusieurs profils
  source: AdherentSource;
  status: AdherentStatus;
  memberSince: string;
  lastLoginAt: number; // minutes ago
  loginCount: number;
  projectCount: number;
};

export const adherents: AdherentRow[] = [
  {
    name: "Marie Dupont",
    email: "marie.dupont@gmail.com",
    profileTypes: ["Administrateur", "Bénévole"],
    source: "Manuel",
    status: "Actif",
    memberSince: "10 Jan 2020, 9:00 AM",
    lastLoginAt: 0,
    loginCount: 312,
    projectCount: 12,
  },
  {
    name: "Jean-Pierre Martin",
    email: "jp.martin@orange.fr",
    profileTypes: ["Coordinateur", "Bénévole", "Adoptant"],
    source: "HelloAsso",
    status: "Actif",
    memberSince: "03 Mar 2021, 2:00 PM",
    lastLoginAt: 2 * 60,
    loginCount: 187,
    projectCount: 9,
  },
  {
    name: "Sophie Lefebvre",
    email: "sophie.lefebvre@laposte.net",
    profileTypes: ["Bénévole", "Famille d'accueil"],
    source: "HelloAsso",
    status: "Actif",
    memberSince: "18 Jun 2022, 11:30 AM",
    lastLoginAt: 15,
    loginCount: 94,
    projectCount: 5,
  },
  {
    name: "Thomas Bernard",
    email: "t.bernard@protonmail.com",
    profileTypes: ["Bénévole", "Adoptant"],
    source: "HelloAsso",
    status: "Actif",
    memberSince: "07 Sep 2022, 4:15 PM",
    lastLoginAt: 3 * 24 * 60,
    loginCount: 22,
    projectCount: 2,
  },
  {
    name: "Camille Rousseau",
    email: "camille.rousseau@gmail.com",
    profileTypes: ["Bénévole", "Adoptant", "Famille d'accueil"],
    source: "HelloAsso",
    status: "Actif",
    memberSince: "22 Jan 2023, 10:45 AM",
    lastLoginAt: 30,
    loginCount: 68,
    projectCount: 4,
  },
  {
    name: "Nicolas Moreau",
    email: "n.moreau@sfr.fr",
    profileTypes: ["Bénévole"],
    source: "HelloAsso",
    status: "En attente",
    memberSince: "14 Apr 2024, 3:00 PM",
    lastLoginAt: 90 * 24 * 60,
    loginCount: 1,
    projectCount: 0,
  },
  {
    name: "Élise Simon",
    email: "elise.simon@gmail.com",
    profileTypes: ["Coordinateur", "Bénévole", "Famille d'accueil"],
    source: "HelloAsso",
    status: "Actif",
    memberSince: "05 Nov 2021, 8:30 AM",
    lastLoginAt: 5 * 60,
    loginCount: 145,
    projectCount: 7,
  },
  {
    name: "Antoine Dubois",
    email: "a.dubois@outlook.fr",
    profileTypes: ["Bénévole"],
    source: "Import CSV",
    status: "Expiré",
    memberSince: "19 Feb 2022, 12:00 PM",
    lastLoginAt: 30 * 24 * 60,
    loginCount: 11,
    projectCount: 1,
  },
  {
    name: "Léa Petit",
    email: "lea.petit@laposte.net",
    profileTypes: ["Bénévole", "Famille d'accueil"],
    source: "HelloAsso",
    status: "Actif",
    memberSince: "30 Aug 2023, 6:00 PM",
    lastLoginAt: 90,
    loginCount: 41,
    projectCount: 3,
  },
  {
    name: "Hugo Laurent",
    email: "hugo.laurent@gmail.com",
    profileTypes: ["Bénévole"],
    source: "HelloAsso",
    status: "Suspendu",
    memberSince: "11 May 2023, 9:15 AM",
    lastLoginAt: 60 * 24 * 60,
    loginCount: 8,
    projectCount: 0,
  },
  {
    name: "Inès Garcia",
    email: "ines.garcia@hotmail.fr",
    profileTypes: ["Bénévole", "Adoptant"],
    source: "HelloAsso",
    status: "Actif",
    memberSince: "02 Dec 2022, 2:30 PM",
    lastLoginAt: 4 * 60,
    loginCount: 76,
    projectCount: 6,
  },
  {
    name: "Paul Robert",
    email: "paul.robert@free.fr",
    profileTypes: ["Bénévole"],
    source: "Manuel",
    status: "Actif",
    memberSince: "28 Mar 2023, 11:00 AM",
    lastLoginAt: 7 * 24 * 60,
    loginCount: 19,
    projectCount: 1,
  },
  {
    name: "Chloé Michel",
    email: "chloe.michel@gmail.com",
    profileTypes: ["Bénévole"],
    source: "HelloAsso",
    status: "En attente",
    memberSince: "17 Jun 2024, 5:45 PM",
    lastLoginAt: 90 * 24 * 60,
    loginCount: 0,
    projectCount: 0,
  },
  {
    name: "Mathieu David",
    email: "m.david@orange.fr",
    profileTypes: ["Bénévole", "Adoptant"],
    source: "HelloAsso",
    status: "Actif",
    memberSince: "09 Oct 2023, 7:20 AM",
    lastLoginAt: 20,
    loginCount: 33,
    projectCount: 2,
  },
  {
    name: "Juliette Fontaine",
    email: "juliette.fontaine@sfr.fr",
    profileTypes: ["Coordinateur", "Bénévole", "Adoptant"],
    source: "Import CSV",
    status: "Actif",
    memberSince: "25 Jul 2021, 3:10 PM",
    lastLoginAt: 6 * 60,
    loginCount: 108,
    projectCount: 8,
  },
  {
    name: "Romain Girard",
    email: "r.girard@protonmail.com",
    profileTypes: ["Bénévole"],
    source: "HelloAsso",
    status: "Actif",
    memberSince: "13 Feb 2024, 1:40 PM",
    lastLoginAt: 45,
    loginCount: 15,
    projectCount: 1,
  },
  {
    name: "Amandine Leroy",
    email: "a.leroy@gmail.com",
    profileTypes: ["Bénévole", "Famille d'accueil"],
    source: "HelloAsso",
    status: "Actif",
    memberSince: "01 Apr 2022, 10:00 AM",
    lastLoginAt: 2 * 24 * 60,
    loginCount: 57,
    projectCount: 4,
  },
  {
    name: "Sébastien Thomas",
    email: "seb.thomas@laposte.net",
    profileTypes: ["Bénévole"],
    source: "HelloAsso",
    status: "Expiré",
    memberSince: "06 Aug 2021, 8:00 AM",
    lastLoginAt: 90 * 24 * 60,
    loginCount: 5,
    projectCount: 0,
  },
  {
    name: "Lucie Blanc",
    email: "lucie.blanc@gmail.com",
    profileTypes: ["Bénévole", "Adoptant"],
    source: "HelloAsso",
    status: "Actif",
    memberSince: "20 Nov 2023, 4:00 PM",
    lastLoginAt: 10,
    loginCount: 29,
    projectCount: 2,
  },
  {
    name: "Maxime Perrin",
    email: "m.perrin@outlook.fr",
    profileTypes: ["Bénévole"],
    source: "Manuel",
    status: "Actif",
    memberSince: "14 May 2024, 9:30 AM",
    lastLoginAt: 3 * 60,
    loginCount: 7,
    projectCount: 1,
  },
];

export const filters = {
  profileType: ["Tous", "Bénévole", "Adoptant", "Famille d'accueil", "Coordinateur", "Administrateur"] as const,
  status: ["Tous", "Actif", "En attente", "Suspendu", "Expiré"] as const,
  source: ["Tous", "HelloAsso", "Manuel", "Import CSV"] as const,
};

export const profileTypeMeta: Record<AdherentProfileType, { className: string; icon: LucideIcon }> = {
  Administrateur: { className: "text-amber-500", icon: ShieldCheck },
  Coordinateur: { className: "text-violet-500", icon: UserCheck },
  Bénévole: { className: "text-muted-foreground", icon: Users },
  Adoptant: { className: "text-emerald-600", icon: TreePine },
  "Famille d'accueil": { className: "text-sky-600", icon: Home },
};

export const statusMeta: Record<AdherentStatus, { badgeClass: string; dotClass: string }> = {
  Actif: {
    badgeClass: "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    dotClass: "bg-emerald-500",
  },
  "En attente": {
    badgeClass: "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400",
    dotClass: "bg-amber-500",
  },
  Suspendu: {
    badgeClass: "border-orange-500/20 bg-orange-500/10 text-orange-600 dark:text-orange-400",
    dotClass: "bg-orange-500",
  },
  Expiré: {
    badgeClass: "border-border bg-muted/50 text-muted-foreground",
    dotClass: "bg-muted-foreground",
  },
};
