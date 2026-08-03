"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";

import {
  Briefcase,
  Calendar,
  Flag,
  Globe,
  Home,
  Languages,
  MapPin,
  MessageSquare,
  TreePine,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { useEngagementProfiles } from "@/lib/engagement/use-engagement-profiles";
import type { EngagementProfileId } from "@/lib/engagement/use-engagement-profiles";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn, getInitials } from "@/lib/utils";

const profileBadgeMeta: Record<EngagementProfileId, { icon: typeof Users; colorClass: string; bgClass: string; borderClass: string }> = {
  "Bénévole": { icon: Users, colorClass: "text-muted-foreground", bgClass: "bg-muted/60", borderClass: "border-border" },
  "Adoptant": { icon: TreePine, colorClass: "text-emerald-600 dark:text-emerald-400", bgClass: "bg-emerald-500/10", borderClass: "border-emerald-500/20" },
  "Famille d'accueil": { icon: Home, colorClass: "text-violet-600 dark:text-violet-400", bgClass: "bg-violet-500/10", borderClass: "border-violet-500/20" },
};

const mockProfile = {
  id: "me",
  name: "Association Repousse",
  title: "Association loi 1901",
  location: "Île-de-France, France",
  joinedDate: "Janvier 2020",
  avatar: "/img/repousse-logo.webp",
  about: {
    fullName: "Association Repousse",
    status: "Active",
    type: "Association",
    region: "Île-de-France",
    languages: "Français",
  },
  contacts: {
    phone: "+33 1 23 45 67 89",
    email: "contact@repousse.org",
    website: "repousse.org",
  },
  groups: [
    { name: "Équipe Terrain", members: 12 },
    { name: "Équipe Coordination", members: 8 },
  ],
  stats: {
    treesPlanted: "2.4k",
    members: 247,
    projects: 18,
  },
};

const mockActivity = [
  {
    id: 1,
    title: "23 nouveaux membres ont rejoint l'association",
    description: "De nouveaux bénévoles sont inscrits ce mois-ci.",
    time: "il y a 12 min",
  },
  {
    id: 2,
    title: "Réunion de coordination mensuelle",
    description: "Réunion tenue le 15 juin à 18h00 au siège.",
    time: "il y a 45 min",
    badge: { label: "compte-rendu.pdf", variant: "outline" as const },
  },
  {
    id: 3,
    title: "Nouveau projet de plantation lancé",
    description: "Parc Rivière Sud — 6 équipes mobilisées.",
    time: "il y a 2 jours",
  },
];

const mockProjects = [
  {
    id: "1",
    name: "Parc de la Villette",
    partner: "Mairie de Paris 19e",
    budgetTotal: "8.4k€",
    budgetSpent: "5.2k€",
    startDate: "12/03/2024",
    endDate: "30/09/2024",
    description:
      "Plantation de 350 arbres fruitiers et arbustes mellifères le long des allées du parc.",
    hoursTotal: 420,
    hoursLogged: 280,
    daysLeft: 42,
    tasksTotal: 48,
    tasksCompleted: 36,
    volunteersCount: 24,
    notesCount: 8,
  },
  {
    id: "2",
    name: "Corridor Écologique Nord",
    partner: "Communauté de Communes",
    budgetTotal: "12.1k€",
    budgetSpent: "4.8k€",
    startDate: "01/05/2024",
    endDate: "31/12/2024",
    description:
      "Création d'un corridor boisé de 2 km reliant deux réserves naturelles existantes.",
    hoursTotal: 680,
    hoursLogged: 190,
    daysLeft: 127,
    tasksTotal: 62,
    tasksCompleted: 18,
    volunteersCount: 37,
    notesCount: 15,
  },
  {
    id: "3",
    name: "Forêt Urbaine Centre",
    partner: "Région Île-de-France",
    budgetTotal: "21.5k€",
    budgetSpent: "18.3k€",
    startDate: "10/01/2024",
    endDate: "15/07/2024",
    description:
      "Micro-forêt Miyawaki de 1 500 m² en cœur de ville — 200 essences locales.",
    hoursTotal: 310,
    hoursLogged: 298,
    daysLeft: 8,
    tasksTotal: 90,
    tasksCompleted: 85,
    volunteersCount: 12,
    notesCount: 31,
  },
];

export default function MemberProfilePage() {
  const params = useParams();
  const id = params.id as string;
  const isOwnProfile = id === "me";
  const { profiles, hydrated } = useEngagementProfiles();
  const { user } = useCurrentUser();

  // For "me", source identity fields from the real authenticated user —
  // everything else (title, location, contacts, groups, stats, activity,
  // projects) has no backend field yet and stays mocked.
  const displayName =
    isOwnProfile && user
      ? [user.first_name, user.last_name].filter(Boolean).join(" ") || user.email
      : mockProfile.name;
  const displayEmail = isOwnProfile && user ? user.email : mockProfile.contacts.email;
  const ownStatusLabel = user?.status === "active" ? "Actif" : "Suspendu";
  const displayStatus = isOwnProfile && user ? ownStatusLabel : mockProfile.about.status;
  const displayAvatar = isOwnProfile ? undefined : mockProfile.avatar;

  return (
    <div className="space-y-4">
      {/* Header card */}
      <Card className="overflow-hidden p-0">
        {/* Banner */}
        <div
          className="h-40 bg-muted"
          style={{
            backgroundImage:
              "linear-gradient(to right, var(--color-border) 1px, transparent 1px), linear-gradient(to bottom, var(--color-border) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        {/* Avatar + info row */}
        <div className="relative flex items-end justify-between px-6 pb-5">
          <div className="flex items-end gap-4">
            <div className="-mt-12 shrink-0">
              <Avatar className="size-24 rounded-xl border-4 border-card shadow-md">
                <AvatarImage src={displayAvatar} alt={displayName} />
                <AvatarFallback className="rounded-xl text-2xl">
                  {getInitials(displayName)}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="pb-1">
              <h1 className="text-2xl font-semibold">{displayName}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground text-sm">
                <span className="flex items-center gap-1.5">
                  <Briefcase className="size-3.5" />
                  {mockProfile.title}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="size-3.5" />
                  {mockProfile.location}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="size-3.5" />
                  {mockProfile.joinedDate}
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2.5">
            {isOwnProfile ? (
              <Button asChild variant="outline" size="sm">
                <Link href={`/membres/${id}/settings`}>Modifier le profil</Link>
              </Button>
            ) : (
              <Button size="sm" className="gap-1.5">
                <UserCheck className="size-4" />
                Connecté
              </Button>
            )}
            {isOwnProfile && hydrated && profiles.length > 0 && (
              <div className="flex flex-wrap justify-end gap-1.5">
                {profiles.map((p) => {
                  const meta = profileBadgeMeta[p];
                  const Icon = meta.icon;
                  return (
                    <Badge
                      key={p}
                      variant="outline"
                      className={cn("gap-1 border font-medium text-xs", meta.borderClass, meta.bgClass, meta.colorClass)}
                    >
                      <Icon className="size-3" />
                      {p}
                    </Badge>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Tab navigation */}
      <Tabs defaultValue="profil">
        <TabsList>
          <TabsTrigger value="profil">Profil</TabsTrigger>
          <TabsTrigger value="projets">Projets de plantation</TabsTrigger>
        </TabsList>

        {/* ── Profil tab ── */}
        <TabsContent value="profil" className="mt-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* Left column */}
            <div className="space-y-4">
              {/* About */}
              <Card>
                <CardContent className="pt-5">
                  <p className="mb-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">
                    À propos
                  </p>
                  <div className="space-y-2.5 text-sm">
                    <Row icon={<Users className="size-4" />} label="Nom" value={displayName} />
                    <Row icon={<UserCheck className="size-4" />} label="Statut" value={displayStatus} />
                    <Row icon={<Briefcase className="size-4" />} label="Type" value={mockProfile.about.type} />
                    <Row icon={<Flag className="size-4" />} label="Région" value={mockProfile.about.region} />
                    <Row icon={<Languages className="size-4" />} label="Langue" value={mockProfile.about.languages} />
                  </div>

                  <p className="mt-5 mb-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">
                    Contacts
                  </p>
                  <div className="space-y-2.5 text-sm">
                    <Row icon={<MessageSquare className="size-4" />} label="Tél." value={mockProfile.contacts.phone} />
                    <Row icon={<Globe className="size-4" />} label="Site" value={mockProfile.contacts.website} />
                    <Row icon={<UserPlus className="size-4" />} label="Email" value={displayEmail} />
                  </div>

                  <p className="mt-5 mb-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">
                    Groupes
                  </p>
                  <div className="space-y-1.5 text-sm">
                    {mockProfile.groups.map((g) => (
                      <div key={g.name} className="flex justify-between">
                        <span className="font-medium">{g.name}:</span>
                        <span className="text-muted-foreground">({g.members} membres)</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Stats overview */}
              <Card>
                <CardContent className="pt-5">
                  <p className="mb-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">
                    Aperçu
                  </p>
                  <div className="space-y-2.5 text-sm">
                    <Row icon={<TreePine className="size-4" />} label="Arbres plantés" value={mockProfile.stats.treesPlanted} />
                    <Row icon={<Users className="size-4" />} label="Membres" value={String(mockProfile.stats.members)} />
                    <Row icon={<Flag className="size-4" />} label="Projets réalisés" value={String(mockProfile.stats.projects)} />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right column — activity */}
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Activité récente</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {mockActivity.map((item) => (
                    <div key={item.id} className="flex gap-4">
                      <div className="mt-1 size-3 shrink-0 rounded-full bg-primary" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium text-sm">{item.title}</p>
                          <span className="shrink-0 text-muted-foreground text-xs">{item.time}</span>
                        </div>
                        <p className="mt-0.5 text-muted-foreground text-sm">{item.description}</p>
                        {item.badge && (
                          <Badge variant={item.badge.variant} className="mt-2 text-xs">
                            {item.badge.label}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ── Projets tab ── */}
        <TabsContent value="projets" className="mt-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {mockProjects.map((project) => (
              <Card key={project.id} className="flex flex-col">
                <CardContent className="flex flex-1 flex-col gap-4 pt-5">
                  {/* Header */}
                  <div className="flex items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <TreePine className="size-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm leading-tight">{project.name}</p>
                      <p className="text-muted-foreground text-xs">Partenaire: {project.partner}</p>
                    </div>
                  </div>

                  {/* Budget + dates */}
                  <div className="flex items-start justify-between text-sm">
                    <div className="rounded-md bg-muted px-2.5 py-1">
                      <p className="font-semibold">{project.budgetSpent}/{project.budgetTotal}</p>
                      <p className="text-muted-foreground text-xs">Budget utilisé</p>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      <p>Début: {project.startDate}</p>
                      <p>Fin: {project.endDate}</p>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-muted-foreground text-sm line-clamp-2">{project.description}</p>

                  {/* Hours + days left */}
                  <div className="flex items-center justify-between text-sm">
                    <span>Heures: {project.hoursLogged}/{project.hoursTotal}</span>
                    <span className="font-medium text-xs">{project.daysLeft} j restants</span>
                  </div>

                  {/* Tasks + progress */}
                  <div>
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        Tâches: {project.tasksCompleted}/{project.tasksTotal}
                      </span>
                      <span className="font-medium">
                        {Math.round((project.tasksCompleted / project.tasksTotal) * 100)}% réalisé
                      </span>
                    </div>
                    <Progress
                      value={Math.round((project.tasksCompleted / project.tasksTotal) * 100)}
                      className="h-1.5"
                    />
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="flex -space-x-2">
                        {Array.from({ length: Math.min(3, project.volunteersCount) }).map((_, i) => (
                          <Avatar key={i} className="size-6 border-2 border-card">
                            <AvatarFallback className="text-[10px]">B{i + 1}</AvatarFallback>
                          </Avatar>
                        ))}
                        {project.volunteersCount > 3 && (
                          <div className="flex size-6 items-center justify-center rounded-full border-2 border-card bg-muted text-[10px]">
                            +{project.volunteersCount - 3}
                          </div>
                        )}
                      </div>
                      <span className="text-muted-foreground text-xs">{project.volunteersCount} bénévoles</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground text-xs">
                      <MessageSquare className="size-3.5" />
                      {project.notesCount}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="shrink-0 text-muted-foreground">{icon}</span>
      <span className="font-medium">{label}:</span>
      <span className="text-muted-foreground">{value}</span>
    </div>
  );
}
