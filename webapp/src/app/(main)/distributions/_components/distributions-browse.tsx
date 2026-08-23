"use client";

import Link from "next/link";

import { useLiveQuery } from "@tanstack/react-db";
import { CalendarDays } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { cn } from "@/lib/utils";
import { EVENT_STATUS_COLORS, EVENT_STATUS_LABELS } from "@/types/distribution";

import { distributionEventCollection } from "./collection";

export function DistributionsBrowse() {
  const { data: events } = useLiveQuery(distributionEventCollection);
  const published = (events ?? []).filter((e) => e.status === "published" || e.status === "closed");

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
      {published.map((event) => (
        <Link key={event.id} href={`/distributions/${encodeURIComponent(event.slug)}`}>
          <Card className="h-full transition-colors hover:border-primary/50">
            {event.image_url && (
              // biome-ignore lint/performance/noImgElement: external/MinIO cover image, not a Next-optimizable static asset
              <img src={event.image_url} alt={event.title} className="h-32 w-full rounded-t-xl border-b object-cover" />
            )}
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base">{event.title}</CardTitle>
                <Badge
                  variant="outline"
                  className={cn("shrink-0 border-0 px-2 py-0.5 font-normal text-xs", EVENT_STATUS_COLORS[event.status])}
                >
                  {EVENT_STATUS_LABELS[event.status]}
                </Badge>
              </div>
              {event.description && (
                <CardDescription className="line-clamp-2 text-xs">{event.description}</CardDescription>
              )}
            </CardHeader>
          </Card>
        </Link>
      ))}
    </div>
  );
}
