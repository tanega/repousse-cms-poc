"use client";

import { useEffect, useState } from "react";

import { useLiveQuery } from "@tanstack/react-db";
import { Sprout } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchProjectReservations } from "@/lib/api/reservations";
import type { Reservation } from "@/types/reservation";

import { taxonCollection } from "../../especes-vegetales/_components/collection";

const dateFormatter = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric" });

/** US-PROJET-11: plants received via distribution reservations tied to this project. */
export function PlantsAssociesCard({ projetId }: { projetId: string }) {
  const { data: taxa } = useLiveQuery(taxonCollection);
  const [reservations, setReservations] = useState<Reservation[]>([]);

  useEffect(() => {
    void fetchProjectReservations(projetId).then(setReservations);
  }, [projetId]);

  function taxonName(taxonId: string) {
    return (taxa ?? []).find((t) => t.id === taxonId)?.common_name ?? taxonId;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5 text-base">
          <Sprout className="size-4" />
          Plants associés via distributions
        </CardTitle>
        <CardDescription className="text-xs">Réservations de plants confirmées pour ce projet.</CardDescription>
      </CardHeader>
      <CardContent>
        {reservations.length === 0 ? (
          <p className="text-muted-foreground text-sm">Aucun plant reçu via une distribution pour l'instant.</p>
        ) : (
          <div className="space-y-2">
            {reservations.map((r) => (
              <div key={r.id} className="rounded-md border p-2.5 text-sm">
                <div className="text-muted-foreground text-xs">{dateFormatter.format(new Date(r.inserted_at))}</div>
                <ul className="mt-1 space-y-0.5">
                  {r.items.map((item) => (
                    <li key={item.id} className="flex justify-between">
                      <span>{taxonName(item.taxon_id)}</span>
                      <span className="font-medium tabular-nums text-muted-foreground">{item.reserved_qty}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
