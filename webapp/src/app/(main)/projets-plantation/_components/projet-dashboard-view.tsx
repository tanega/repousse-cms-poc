"use client";

import Link from "next/link";
import { notFound } from "next/navigation";

import { useLiveQuery } from "@tanstack/react-db";
import { ArrowLeft, Layers, MapPin, Ruler, ShieldAlert, Sprout } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { taxons } from "../../admin/especes-vegetales/_components/data";
import { CarteMini } from "../../admin/projets-plantation/_components/carte-mini";
import { projetPlantationCollection } from "../../admin/projets-plantation/_components/collection";
import { CURRENT_USER, getCurrentUserRole } from "../../admin/projets-plantation/_components/current-user";
import { findProjetById, STATUT_COLORS } from "../../admin/projets-plantation/_components/data";
import { JournalCard } from "../../admin/projets-plantation/_components/journal-card";
import { MediasCard } from "../../admin/projets-plantation/_components/medias-card";
import { MembresCard } from "../../admin/projets-plantation/_components/membres-card";
import { PlantsAssociesCard } from "../../admin/projets-plantation/_components/plants-associes-card";

function taxonName(taxonId: string) {
  return taxons.find((t) => t.id === taxonId)?.nomCommun ?? taxonId;
}

export function ProjetDashboardView({ id }: { id: string }) {
  const { data: projets } = useLiveQuery(projetPlantationCollection);
  const projet = findProjetById(id, projets ?? []);

  if (!projet) notFound();

  const role = getCurrentUserRole(projet);
  const isMember = role !== null;

  // Privé/Dépublié projects are only visible to their own members.
  if (projet.statut !== "Public" && !isMember) notFound();

  const isAdmin = role === "Administrateur";
  const canWrite = role === "Administrateur" || role === "Éditeur";

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon-sm" asChild>
          <Link href="/projets-plantation" aria-label="Retour aux projets de plantation">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-semibold text-2xl">{projet.nom}</h1>
            <Badge
              variant="outline"
              className={cn("border-0 px-2 py-0.5 font-normal text-xs", STATUT_COLORS[projet.statut])}
            >
              {projet.statut}
            </Badge>
            {role && (
              <Badge variant="outline" className="px-2 py-0.5 font-normal text-xs">
                Vous : {role}
              </Badge>
            )}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-muted-foreground text-xs">
            <MapPin className="size-3" />
            {projet.adresse || "Adresse non renseignée"}
          </div>
        </div>
      </div>

      {projet.statut === "Dépublié" && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-destructive text-sm">
          <ShieldAlert className="mt-0.5 size-4 shrink-0" />
          <div>
            <p className="font-medium">Ce projet a été dépublié par la modération.</p>
            {projet.motifDepublication && <p className="text-destructive/80 text-xs">{projet.motifDepublication}</p>}
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left 2/3 */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-muted-foreground text-sm">
                {projet.description || "Aucune description."}
              </p>
            </CardContent>
          </Card>

          {projet.lat !== null && projet.lng !== null && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Localisation</CardTitle>
              </CardHeader>
              <CardContent>
                <CarteMini lat={projet.lat} lng={projet.lng} label={projet.nom} />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Terrain</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Layers className="size-3.5" />
                Gestion
              </div>
              <div className="text-right font-medium">{projet.natureGestion}</div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Ruler className="size-3.5" />
                Surface
              </div>
              <div className="text-right font-medium">
                {projet.surfaceM2 !== null ? `${projet.surfaceM2} m²` : "Non renseignée"}
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Sprout className="size-3.5" />
                Nature du sol
              </div>
              <div className="text-right font-medium">{projet.natureSol || "Non renseignée"}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Espèces préférentielles</CardTitle>
            </CardHeader>
            <CardContent>
              {projet.especeIds.length === 0 ? (
                <p className="text-muted-foreground text-sm">Aucune espèce associée.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {projet.especeIds.map((especeId) => (
                    <Badge key={especeId} variant="secondary" className="font-normal">
                      {taxonName(especeId)}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <PlantsAssociesCard projetId={projet.id} />

          <MediasCard projet={projet} canEdit={canWrite} />

          <JournalCard projet={projet} currentUserNom={CURRENT_USER.nom} canPost={canWrite} isProjectAdmin={isAdmin} />
        </div>

        {/* Right 1/3 */}
        <div className="space-y-6">
          <MembresCard projet={projet} canManage={isAdmin} />
        </div>
      </div>
    </div>
  );
}
