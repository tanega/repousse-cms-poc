"use client";

import { useState } from "react";

import Link from "next/link";
import { notFound, useRouter } from "next/navigation";

import { useLiveQuery } from "@tanstack/react-db";
import { ArrowLeft, CalendarDays, Link2, Mail, MapPin, Pencil, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

import { taxons } from "../../especes-vegetales/_components/data";
import { distributionEventCollection } from "./collection";
import { findEventById, STATUT_COLORS, STATUT_TRANSITIONS, type StatutEvenement } from "./data";
import type { DeleteTarget } from "./delete-alert-dialog";
import { DeleteAlertDialog } from "./delete-alert-dialog";

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

function taxonName(taxonId: string) {
  const taxon = taxons.find((t) => t.id === taxonId);
  return taxon?.nomCommun ?? taxonId;
}

export function DistributionDetailView({ id }: { id: string }) {
  const router = useRouter();
  const { data: events } = useLiveQuery(distributionEventCollection);
  const event = findEventById(id, events ?? []);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  if (!event) notFound();

  const transitions = STATUT_TRANSITIONS[event.statut];

  function handleStatutChange(statut: StatutEvenement) {
    distributionEventCollection.update(event!.id, (draft) => {
      draft.statut = statut;
    });
  }

  function handleDelete(deleteId: string) {
    distributionEventCollection.delete([deleteId]);
    router.push("/admin/distributions");
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon-sm" asChild>
            <Link href="/admin/distributions" aria-label="Retour à la liste des distributions">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold">{event.intitule}</h1>
              <Badge
                variant="outline"
                className={cn("border-0 px-2 py-0.5 text-xs font-normal", STATUT_COLORS[event.statut])}
              >
                {event.statut}
              </Badge>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-muted-foreground text-xs">
              <Link2 className="size-3" />
              <code>/distributions/{event.lienPermanent}</code>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/admin/distributions/${event.id}/modifier`}>
                <Pencil className="size-4" />
                Modifier
              </Link>
            </Button>
            {transitions.map((statut) => (
              <Button
                key={statut}
                variant={statut === "Publié" ? "default" : "outline"}
                size="sm"
                onClick={() => handleStatutChange(statut)}
              >
                {statut === "Publié" && "Publier"}
                {statut === "Brouillon" && "Repasser en brouillon"}
                {statut === "Clôturé" && "Clôturer"}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left 2/3 */}
          <div className="space-y-6 lg:col-span-2">
            {event.imageUrl && (
              <img src={event.imageUrl} alt={event.intitule} className="h-48 w-full rounded-md border object-cover" />
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-muted-foreground text-sm">
                  {event.description || "Aucune description."}
                </p>
                {event.contactGeneral && (
                  <div className="mt-3 flex items-center gap-1.5 text-muted-foreground text-sm">
                    <Mail className="size-3.5" />
                    {event.contactGeneral}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Créneaux</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {event.creneaux.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Aucun créneau défini.</p>
                ) : (
                  event.creneaux.map((c) => (
                    <div key={c.id} className="flex items-start gap-3 rounded-md border p-3 text-sm">
                      <CalendarDays className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium capitalize">
                          {c.date ? dateFormatter.format(new Date(c.date)) : "Date à définir"}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          {c.heureDebut} – {c.heureFin}
                        </div>
                        <div className="mt-1 flex items-center gap-1 text-muted-foreground text-xs">
                          <MapPin className="size-3" />
                          {c.lieu}
                        </div>
                        {c.contact && <div className="text-muted-foreground text-xs">{c.contact}</div>}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Stock d'espèces</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {event.stock.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Aucune espèce associée.</p>
                ) : (
                  event.stock.map((s) => (
                    <div key={s.taxonId} className="flex items-center justify-between text-sm">
                      <span>{taxonName(s.taxonId)}</span>
                      <span className="font-medium tabular-nums text-muted-foreground">
                        {s.quantite === null ? "Quantité inconnue" : `${s.quantite} restants`}
                      </span>
                    </div>
                  ))
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
                    <Users className="size-3.5" />
                    Inscrits
                  </span>
                  <span className="font-medium text-foreground tabular-nums">{event.nbInscrits}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-muted-foreground">
                  <span>Identifiant</span>
                  <code className="font-mono text-xs text-foreground">{event.id}</code>
                </div>
                <Separator />
                <div className="flex justify-between text-muted-foreground">
                  <span>Créé le</span>
                  <span className="font-medium text-foreground">{event.createdAt}</span>
                </div>
              </CardContent>
            </Card>

            <Button
              variant="destructive"
              className="w-full"
              disabled={event.nbInscrits > 0}
              onClick={() => setDeleteTarget({ event })}
            >
              Supprimer cet événement
            </Button>
          </div>
        </div>
      </div>

      <DeleteAlertDialog target={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} />
    </>
  );
}
