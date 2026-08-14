"use client";

import { useState } from "react";

import Link from "next/link";
import { notFound, useRouter } from "next/navigation";

import { useLiveQuery } from "@tanstack/react-db";
import { ArrowLeft, Layers, MapPin, Pencil, Ruler, Sprout } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { cn } from "@/lib/utils";
import {
  findProjectById,
  MANAGEMENT_TYPE_LABELS,
  PUBLICATION_STATUS_COLORS,
  PUBLICATION_STATUS_LABELS,
  PUBLICATION_STATUS_TRANSITIONS,
  type PublicationStatus,
} from "@/types/project";

import { taxonCollection } from "../../especes-vegetales/_components/collection";
import { CarteMini } from "./carte-mini";
import type { DeleteTarget } from "./delete-alert-dialog";
import { DeleteAlertDialog } from "./delete-alert-dialog";
import { projectCollection } from "./project-collection";

export function ProjetDetailView({ id }: { id: string }) {
  const router = useRouter();
  const { data: projets } = useLiveQuery(projectCollection);
  const { data: taxons } = useLiveQuery(taxonCollection);
  const { user } = useCurrentUser();
  const projet = findProjectById(id, projets ?? []);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  if (!projet) notFound();

  const isOwner = !!user && user.id === projet.owner_id;
  const transitions = isOwner ? PUBLICATION_STATUS_TRANSITIONS[projet.publication_status] : [];

  function handleStatutChange(statut: PublicationStatus) {
    if (!projet) return;
    projectCollection.update(projet.id, (draft) => {
      draft.publication_status = statut;
    });
  }

  function handleDelete(deleteId: string) {
    projectCollection.delete([deleteId]);
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
              <h1 className="text-2xl font-semibold">{projet.name}</h1>
              <Badge
                variant="outline"
                className={cn(
                  "border-0 px-2 py-0.5 text-xs font-normal",
                  PUBLICATION_STATUS_COLORS[projet.publication_status],
                )}
              >
                {PUBLICATION_STATUS_LABELS[projet.publication_status]}
              </Badge>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-muted-foreground text-xs">
              <MapPin className="size-3" />
              {projet.address ?? "Adresse non renseignée"}
            </div>
          </div>
          {isOwner && (
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
                  variant={statut === "public" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleStatutChange(statut)}
                >
                  {statut === "public" && "Publier"}
                  {statut === "private" && "Repasser en privé"}
                </Button>
              ))}
            </div>
          )}
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
                  {projet.description ?? "Aucune description."}
                </p>
              </CardContent>
            </Card>

            {projet.lat !== null && projet.lng !== null && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Localisation</CardTitle>
                </CardHeader>
                <CardContent>
                  <CarteMini lat={projet.lat} lng={projet.lng} label={projet.name} />
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
                <div className="text-right font-medium">{MANAGEMENT_TYPE_LABELS[projet.management_type]}</div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Ruler className="size-3.5" />
                  Surface
                </div>
                <div className="text-right font-medium">
                  {projet.surface_m2 !== null ? `${projet.surface_m2} m²` : "Non renseignée"}
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Sprout className="size-3.5" />
                  Nature du sol
                </div>
                <div className="text-right font-medium">{projet.soil_type ?? "Non renseignée"}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Espèces préférentielles</CardTitle>
              </CardHeader>
              <CardContent>
                {projet.preferred_species.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Aucune espèce associée.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {projet.preferred_species.map((s) => {
                      const taxon = taxons?.find((t) => t.id === s.taxon_id);
                      return (
                        <Badge key={s.id} variant="secondary" className="font-normal">
                          {taxon?.common_name ?? s.taxon_id}
                        </Badge>
                      );
                    })}
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
                <div className="flex justify-between text-muted-foreground">
                  <span>Identifiant</span>
                  <code className="font-mono text-xs text-foreground">{projet.id}</code>
                </div>
                <Separator />
                <div className="flex justify-between text-muted-foreground">
                  <span>Créé le</span>
                  <span className="font-medium text-foreground">
                    {new Date(projet.inserted_at).toLocaleDateString("fr-FR")}
                  </span>
                </div>
                {projet.published_at && (
                  <>
                    <Separator />
                    <div className="flex justify-between text-muted-foreground">
                      <span>Publié le</span>
                      <span className="font-medium text-foreground">
                        {new Date(projet.published_at).toLocaleDateString("fr-FR")}
                      </span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {isOwner && (
              <Button variant="destructive" className="w-full" onClick={() => setDeleteTarget({ projet })}>
                Supprimer ce projet
              </Button>
            )}
          </div>
        </div>
      </div>

      <DeleteAlertDialog target={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} />
    </>
  );
}
