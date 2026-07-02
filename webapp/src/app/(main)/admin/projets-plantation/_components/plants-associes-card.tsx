"use client";

import { useLiveQuery } from "@tanstack/react-db";
import { Sprout } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { reservationsCollection } from "../../../distributions/_components/reservations-collection";
import { taxons } from "../../especes-vegetales/_components/data";

const dateFormatter = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric" });

function taxonName(taxonId: string) {
  return taxons.find((t) => t.id === taxonId)?.nomCommun ?? taxonId;
}

/** US-PROJET-11: plants received via distribution reservations tied to this project. */
export function PlantsAssociesCard({ projetId }: { projetId: string }) {
  const { data: reservations } = useLiveQuery(reservationsCollection);
  const rows = (reservations ?? []).filter((r) => r.projetPlantationId === projetId && r.statut === "Confirmée");

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
        {rows.length === 0 ? (
          <p className="text-muted-foreground text-sm">Aucun plant reçu via une distribution pour l'instant.</p>
        ) : (
          <div className="space-y-2">
            {rows.map((r) => (
              <div key={r.id} className="rounded-md border p-2.5 text-sm">
                <div className="text-muted-foreground text-xs">{dateFormatter.format(new Date(r.createdAt))}</div>
                <ul className="mt-1 space-y-0.5">
                  {r.lignes.map((l) => (
                    <li key={l.taxonId} className="flex justify-between">
                      <span>{taxonName(l.taxonId)}</span>
                      <span className="font-medium tabular-nums text-muted-foreground">{l.quantite}</span>
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
