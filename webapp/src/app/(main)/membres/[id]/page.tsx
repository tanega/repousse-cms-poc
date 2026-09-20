"use client";

import { useEffect, useState } from "react";

import Link from "next/link";
import { useParams } from "next/navigation";

import {
  Calendar,
  Home,
  Lock,
  MapPin,
  Ruler,
  Sprout,
  TreePine,
  Users,
  Warehouse,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { type MemberProfile, fetchMemberProfile } from "@/lib/api/members";
import { fetchPublicTaxa } from "@/lib/api/taxa";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import {
  type EngagementProfileId,
  toEngagementProfileId,
} from "@/lib/engagement/use-engagement-profiles";
import { cn, getInitials } from "@/lib/utils";
import type { Taxon } from "@/types/taxon";
import type { HostingEquipment, UserProfile } from "@/types/user";

const profileBadgeMeta: Record<
  EngagementProfileId,
  { icon: typeof Users; colorClass: string; bgClass: string; borderClass: string }
> = {
  Bénévole: {
    icon: Users,
    colorClass: "text-muted-foreground",
    bgClass: "bg-muted/60",
    borderClass: "border-border",
  },
  Adoptant: {
    icon: TreePine,
    colorClass: "text-emerald-600 dark:text-emerald-400",
    bgClass: "bg-emerald-500/10",
    borderClass: "border-emerald-500/20",
  },
  "Famille d'accueil": {
    icon: Home,
    colorClass: "text-violet-600 dark:text-violet-400",
    bgClass: "bg-violet-500/10",
    borderClass: "border-violet-500/20",
  },
};

const EQUIPMENT_LABELS: Record<HostingEquipment, string> = {
  greenhouse: "Serre",
  tarp: "Bâche",
  auto_watering: "Arrosage automatique",
  artificial_light: "Lumière artificielle",
  cold_frame: "Châssis froid",
  outdoor_ground: "Pleine terre extérieure",
};

function formatJoinedDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}

export default function MemberProfilePage() {
  const params = useParams();
  const id = params.id as string;
  const isOwnProfile = id === "me";
  const { user } = useCurrentUser();

  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [taxa, setTaxa] = useState<Taxon[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMemberProfile(id)
      .then(setProfile)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Profil introuvable."),
      );
  }, [id]);

  useEffect(() => {
    fetchPublicTaxa()
      .then(setTaxa)
      .catch(() => setTaxa([]));
  }, []);

  if (error) {
    return <p className="text-muted-foreground text-sm">{error}</p>;
  }
  if (!profile) {
    return <p className="text-muted-foreground text-sm">Chargement du profil…</p>;
  }

  const { user: member, profiles, nurseries, visible } = profile;
  const displayName =
    [member.first_name, member.last_name].filter(Boolean).join(" ") || "Membre sans nom";
  const engagements = profiles.map((p) => toEngagementProfileId(p.profile_type)).filter(Boolean);
  const hostFamily = profiles.find((p) => p.profile_type === "host_family");
  const canEdit = isOwnProfile || member.id === user?.id;

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden p-0">
        {/* Banner — avatar shown blurred/grayscale as a placeholder background until banner image upload exists */}
        <div className="relative h-40 overflow-hidden bg-muted">
          {member.avatar_url ? (
            // biome-ignore lint/performance/noImgElement: avatar_url is an external MinIO URL, not configured in next/image remotePatterns
            <img
              src={member.avatar_url}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 size-full scale-110 object-cover object-center blur-xs grayscale"
            />
          ) : (
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "linear-gradient(to right, var(--color-border) 1px, transparent 1px), linear-gradient(to bottom, var(--color-border) 1px, transparent 1px)",
                backgroundSize: "28px 28px",
              }}
            />
          )}
        </div>

        <div className="relative flex flex-wrap items-end justify-between gap-4 px-6 pb-5">
          <div className="flex items-end gap-4">
            <div className="-mt-12 shrink-0">
              <Avatar className="size-24 rounded-xl border-4 border-card shadow-md">
                <AvatarImage src={member.avatar_url ?? undefined} alt={displayName} />
                <AvatarFallback className="rounded-xl text-2xl">
                  {getInitials(displayName)}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="pb-1">
              <h1 className="font-semibold text-2xl">{displayName}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground text-sm">
                <span className="flex items-center gap-1.5">
                  <Calendar className="size-3.5" />
                  Membre depuis {formatJoinedDate(member.inserted_at)}
                </span>
                {member.profile_visibility === "private" && (
                  <span className="flex items-center gap-1.5">
                    <Lock className="size-3.5" />
                    Profil privé
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2.5">
            {canEdit && (
              <Button asChild variant="outline" size="sm">
                <Link href={`/membres/${id}/settings`}>Modifier le profil</Link>
              </Button>
            )}
            {engagements.length > 0 && (
              <div className="flex flex-wrap justify-end gap-1.5">
                {engagements.map((p) => {
                  const meta = profileBadgeMeta[p];
                  const Icon = meta.icon;
                  return (
                    <Badge
                      key={p}
                      variant="outline"
                      className={cn(
                        "gap-1 border font-medium text-xs",
                        meta.borderClass,
                        meta.bgClass,
                        meta.colorClass,
                      )}
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

      <Tabs defaultValue="profil">
        <TabsList>
          <TabsTrigger value="profil">Profil</TabsTrigger>
          {hostFamily && <TabsTrigger value="nurseries">Nurseries</TabsTrigger>}
        </TabsList>

        <TabsContent value="profil" className="mt-4">
          {hostFamily ? (
            <HostFamilyCard profile={hostFamily} taxa={taxa} visible={visible} />
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground text-sm">
                Ce membre n'a pas encore renseigné d'informations complémentaires.
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {hostFamily && (
          <TabsContent value="nurseries" className="mt-4">
            {!visible ? (
              <Card>
                <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
                  <Lock className="size-8 text-muted-foreground" />
                  <p className="font-medium text-sm">Nurseries non visibles</p>
                  <p className="max-w-md text-muted-foreground text-sm">
                    Ce membre a choisi de garder son profil privé. Seuls les coordinateurs peuvent
                    consulter ses nurseries.
                  </p>
                </CardContent>
              </Card>
            ) : nurseries.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground text-sm">
                  Aucune nurserie déclarée.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {nurseries.map((nursery) => {
                  const total = nursery.plants.reduce((sum, p) => sum + p.quantity, 0);
                  return (
                    <Card key={nursery.id}>
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                          <Warehouse className="size-4 shrink-0 text-muted-foreground" />
                          {nursery.name}
                        </CardTitle>
                        {nursery.address && (
                          <p className="flex items-center gap-1 text-muted-foreground text-xs">
                            <MapPin className="size-3 shrink-0" />
                            <span className="truncate">{nursery.address}</span>
                          </p>
                        )}
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <Badge variant="outline">
                          {total} plant{total > 1 ? "s" : ""}
                        </Badge>
                        <ul className="space-y-1 text-sm">
                          {nursery.plants.map((plant) => {
                            const taxon = taxa.find((t) => t.id === plant.taxon_id);
                            return (
                              <li key={plant.id} className="flex items-center justify-between gap-2">
                                <span className="flex min-w-0 items-center gap-1.5">
                                  <Sprout className="size-3.5 shrink-0 text-muted-foreground" />
                                  <span className="truncate">
                                    {taxon?.common_name ?? "Espèce inconnue"}
                                  </span>
                                </span>
                                <span className="shrink-0 text-muted-foreground">
                                  {plant.quantity}
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                        {nursery.notes && (
                          <p className="text-muted-foreground text-sm">{nursery.notes}</p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

function HostFamilyCard({
  profile,
  taxa,
  visible,
}: {
  profile: UserProfile;
  taxa: Taxon[];
  visible: boolean;
}) {
  const species = profile.hosted_species.map(
    (s) => taxa.find((t) => t.id === s.taxon_id)?.common_name ?? "Espèce inconnue",
  );

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Home className="size-4 text-violet-600 dark:text-violet-400" />
          Capacités d'accueil
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2.5 text-sm">
        <Row
          icon={<Warehouse className="size-4" />}
          label="Capacité"
          value={profile.hosting_capacity ? `${profile.hosting_capacity} plants` : "Non renseignée"}
        />
        <Row
          icon={<Ruler className="size-4" />}
          label="Surface"
          value={profile.hosting_surface_m2 ? `${profile.hosting_surface_m2} m²` : "Non renseignée"}
        />
        <Row
          icon={<Calendar className="size-4" />}
          label="Disponibilités"
          value={profile.hosting_availability ?? "Non renseignées"}
        />
        <Row
          icon={<MapPin className="size-4" />}
          label="Zone d'accueil"
          value={
            visible ? (profile.hosting_address ?? "Non renseignée") : "Réservée aux coordinateurs"
          }
        />

        {profile.hosting_equipment.length > 0 && (
          <div className="pt-2">
            <p className="mb-2 font-semibold text-muted-foreground text-xs uppercase tracking-wide">
              Équipements
            </p>
            <div className="flex flex-wrap gap-1.5">
              {profile.hosting_equipment.map((e) => (
                <Badge key={e} variant="secondary">
                  {EQUIPMENT_LABELS[e] ?? e}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {species.length > 0 && (
          <div className="pt-2">
            <p className="mb-2 font-semibold text-muted-foreground text-xs uppercase tracking-wide">
              Espèces pouvant être accueillies
            </p>
            <div className="flex flex-wrap gap-1.5">
              {species.map((name) => (
                <Badge key={name} variant="secondary">
                  {name}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
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
