"use client";

import Link from "next/link";

import { useLiveQuery } from "@tanstack/react-db";
import { CalendarDays, MapPin } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { cn } from "@/lib/utils";

import { distributionEventCollection } from "./mock-collection";
import { STATUT_COLORS } from "./mock-events";

const dateFormatter = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" });

export function DistributionsBrowse() {
  const { data: events } = useLiveQuery(distributionEventCollection);
  const published = (events ?? []).filter((e) => e.statut === "Publié" || e.statut === "Clôturé");

  if (published.length === 0) {
    return (
      <Empty>
        <EmptyMedia>
          <CalendarDays className="size-8 text-muted-foreground" />
        </EmptyMedia>
        <EmptyTitle>Aucune distribution en cours</EmptyTitle>
        <EmptyDescription>Revenez plus tard pour les prochaines campagnes de distribution.</EmptyDescription>
      </Empty>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {published.map((event) => {
        const dates = event.creneaux.map((c) => dateFormatter.format(new Date(c.date))).sort();
        return (
          <Link key={event.id} href={`/distributions/${encodeURIComponent(event.lienPermanent)}`}>
            <Card className="h-full transition-colors hover:border-primary/50">
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base">{event.intitule}</CardTitle>
                  <Badge
                    variant="outline"
                    className={cn("shrink-0 border-0 px-2 py-0.5 font-normal text-xs", STATUT_COLORS[event.statut])}
                  >
                    {event.statut}
                  </Badge>
                </div>
                <CardDescription className="line-clamp-2 text-xs">{event.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-1 text-muted-foreground text-xs">
                {dates.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <CalendarDays className="size-3.5" />
                    {dates[0] === dates[dates.length - 1] ? dates[0] : `${dates[0]} → ${dates[dates.length - 1]}`}
                  </div>
                )}
                {event.creneaux[0] && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="size-3.5" />
                    {event.creneaux[0].lieu}
                  </div>
                )}
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
