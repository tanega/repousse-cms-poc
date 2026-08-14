"use client";

import { useMemo, useState } from "react";

import Link from "next/link";
import { notFound, useRouter } from "next/navigation";

import { useLiveQuery } from "@tanstack/react-db";
import { ArrowLeft, CalendarDays, Link2, Mail, MapPin, Pencil, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  EVENT_STATUS_COLORS,
  EVENT_STATUS_LABELS,
  EVENT_STATUS_TRANSITIONS,
  type EventStatus,
  findEventById,
} from "@/types/distribution";

import { taxonCollection } from "../../especes-vegetales/_components/collection";
import { createSlotCollection, createStockCollection, distributionEventCollection } from "./collection";
import type { DeleteTarget } from "./delete-alert-dialog";
import { DeleteAlertDialog } from "./delete-alert-dialog";

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

const createdAtFormatter = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" });

export function DistributionDetailView({ id }: { id: string }) {
  const router = useRouter();
  const { data: events, isLoading: eventsLoading } = useLiveQuery(distributionEventCollection);
  const event = findEventById(id, events ?? []);

  const slotCollection = useMemo(() => createSlotCollection(id), [id]);
  const stockCollection = useMemo(() => createStockCollection(id), [id]);
  const { data: slots } = useLiveQuery(slotCollection);
  const { data: stocks } = useLiveQuery(stockCollection);
  const { data: taxa } = useLiveQuery(taxonCollection);

  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  if (eventsLoading) return null;
  if (!event) notFound();

  const transitions = EVENT_STATUS_TRANSITIONS[event.status];

  function handleStatusChange(status: EventStatus) {
    distributionEventCollection.update(event!.id, (draft) => {
      draft.status = status;
    });
  }

  function handleDelete(deleteId: string) {
    distributionEventCollection.delete([deleteId]);
    router.push("/admin/distributions");
  }

  function taxonName(taxonId: string) {
    return taxa?.find((t) => t.id === taxonId)?.common_name ?? taxonId;
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
              <h1 className="text-2xl font-semibold">{event.title}</h1>
              <Badge
                variant="outline"
                className={cn("border-0 px-2 py-0.5 text-xs font-normal", EVENT_STATUS_COLORS[event.status])}
              >
                {EVENT_STATUS_LABELS[event.status]}
              </Badge>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-muted-foreground text-xs">
              <Link2 className="size-3" />
              <code>/distributions/{event.slug}</code>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/admin/distributions/${event.id}/modifier`}>
                <Pencil className="size-4" />
                Modifier
              </Link>
            </Button>
            {transitions.map((status) => (
              <Button
                key={status}
                variant={status === "published" ? "default" : "outline"}
                size="sm"
                onClick={() => handleStatusChange(status)}
              >
                {status === "published" && "Publier"}
                {status === "closed" && "Clôturer"}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left 2/3 */}
          <div className="space-y-6 lg:col-span-2">
            {event.image_url && (
              // biome-ignore lint/performance/noImgElement: MinIO-hosted cover image
              <img src={event.image_url} alt={event.title} className="h-48 w-full rounded-md border object-cover" />
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-muted-foreground text-sm">
                  {event.description ? event.description : "Aucune description."}
                </p>
                {event.general_contact && (
                  <div className="mt-3 flex items-center gap-1.5 text-muted-foreground text-sm">
                    <Mail className="size-3.5" />
                    {event.general_contact}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Créneaux</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {!slots || slots.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Aucun créneau défini.</p>
                ) : (
                  slots.map((s) => (
                    <div key={s.id} className="flex items-start gap-3 rounded-md border p-3 text-sm">
                      <CalendarDays className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium capitalize">
                          {s.date ? dateFormatter.format(new Date(s.date)) : "Date à définir"}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          {s.start_time} – {s.end_time}
                        </div>
                        <div className="mt-1 flex items-center gap-1 text-muted-foreground text-xs">
                          <MapPin className="size-3" />
                          {s.location_name}
                        </div>
                        {s.contact && <div className="text-muted-foreground text-xs">{s.contact}</div>}
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
                {!stocks || stocks.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Aucune espèce associée.</p>
                ) : (
                  stocks.map((s) => (
                    <div key={s.id} className="flex items-center justify-between text-sm">
                      <span>{taxonName(s.taxon_id)}</span>
                      <span className="font-medium tabular-nums text-muted-foreground">
                        {s.quantity_unknown
                          ? "Quantité inconnue"
                          : `${(s.quantity ?? 0) - s.reserved_quantity} restants`}
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
                  <span className="font-medium text-foreground tabular-nums">{event.reservations_count}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-muted-foreground">
                  <span>Identifiant</span>
                  <code className="font-mono text-xs text-foreground">{event.id}</code>
                </div>
                <Separator />
                <div className="flex justify-between text-muted-foreground">
                  <span>Créé le</span>
                  <span className="font-medium text-foreground">
                    {createdAtFormatter.format(new Date(event.inserted_at))}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Button
              variant="destructive"
              className="w-full"
              disabled={event.reservations_count > 0}
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
