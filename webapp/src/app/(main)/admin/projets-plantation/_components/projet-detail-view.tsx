"use client";

import { useState } from "react";

import Link from "next/link";
import { notFound, useRouter } from "next/navigation";

import { useLiveQuery } from "@tanstack/react-db";
import { ArrowLeft, Layers, MapPin, Pencil, Ruler, Sprout, User, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

import { taxons } from "../../especes-vegetales/_components/data";
import { projetPlantationCollection } from "./collection";
import { findProjetById, STATUT_COLORS, STATUT_TRANSITIONS, type StatutPublication } from "./data";
import type { DeleteTarget } from "./delete-alert-dialog";
import { DeleteAlertDialog } from "./delete-alert-dialog";

function taxonName(taxonId: string) {
  const taxon = taxons.find((t) => t.id === taxonId);
  return taxon?.nomCommun ?? taxonId;
}

export function ProjetDetailView({ id }: { id: string }) {
  const router = useRouter();
  const { data: projets } = useLiveQuery(projetPlantationCollection);
  const projet = findProjetById(id, projets ?? []);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  if (!projet) notFound();

  const transitions = STATUT_TRANSITIONS[projet.statut];

  function handleStatutChange(statut: StatutPublication) {
    projetPlantationCollection.update(projet!.id, (draft) => {
      draft.statut = statut;
      if (statut === "Public" && !draft.publishedAt) {
        draft.publishedAt = new Date().toISOString().slice(0, 10);
      }
    });
  }

  function handleDelete(deleteId: string) {
    projetPlantationCollection.delete([deleteId]);
    router.push("/admin/projets-plantation");
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon-sm" asChild>
            <Link href="/admin/projets-plantation" aria-label="Retour à la liste des projets">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold">{projet.nom}</h1>
              <Badge
                variant="outline"
                className={cn("border-0 px-2 py-0.5 text-xs font-normal", STATUT_COLORS[projet.statut])}
              >
                {projet.statut}
              </Badge>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-muted-foreground text-xs">
              <MapPin className="size-3" />
              {projet.adresse || "Adresse non renseignée"}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/admin/projets-plantation/${projet.id}/modifier`}>
                <Pencil className="size-4" />
                Modifier
              </Link>
            </Button>
            {transitions.map((statut) => (
              <Button
                key={statut}
                variant={statut === "Public" ? "default" : "outline"}
                size="sm"
                onClick={() => handleStatutChange(statut)}
              >
                {statut === "Public" && "Publier"}
                {statut === "Privé" && "Repasser en privé"}
              </Button>
            ))}
          </div>
        </div>

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
                    {projet.especeIds.map((id) => (
                      <Badge key={id} variant="secondary" className="font-normal">
                        {taxonName(id)}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right 1/3 */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Informations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <User className="size-3.5" />
                    Créateur
                  </span>
                  <span className="font-medium text-foreground">{projet.createurNom}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Users className="size-3.5" />
                    Membres
                  </span>
                  <span className="font-medium text-foreground tabular-nums">{projet.nbMembres}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-muted-foreground">
                  <span>Identifiant</span>
                  <code className="font-mono text-xs text-foreground">{projet.id}</code>
                </div>
                <Separator />
                <div className="flex justify-between text-muted-foreground">
                  <span>Créé le</span>
                  <span className="font-medium text-foreground">{projet.createdAt}</span>
                </div>
                {projet.publishedAt && (
                  <>
                    <Separator />
                    <div className="flex justify-between text-muted-foreground">
                      <span>Publié le</span>
                      <span className="font-medium text-foreground">{projet.publishedAt}</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Button variant="destructive" className="w-full" onClick={() => setDeleteTarget({ projet })}>
              Supprimer ce projet
            </Button>
          </div>
        </div>
      </div>

      <DeleteAlertDialog target={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} />
    </>
  );
}
