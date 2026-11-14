"use client";

import { useEffect, useState } from "react";

import { HandoverPanel } from "@/app/(main)/distributions/_components/handover-panel";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetchEvents } from "@/lib/api/distributions";
import type { DistributionEvent } from "@/types/distribution";

export default function RemisePage() {
  const [events, setEvents] = useState<DistributionEvent[]>([]);
  const [eventId, setEventId] = useState("");

  useEffect(() => {
    fetchEvents()
      .then((list) => {
        setEvents(list);
        if (list[0]) setEventId(list[0].id);
      })
      .catch(() => setEvents([]));
  }, []);

  return (
    <div className="@container/main flex flex-col gap-6">
      <div>
        <h1 className="font-semibold text-2xl">Remise des plants</h1>
        <p className="mt-1 text-muted-foreground text-sm">
          Le jour de la distribution, notez ce que chaque adoptant repart avec. C'est ajouté à son projet.
        </p>
      </div>
      <Select value={eventId} onValueChange={setEventId}>
        <SelectTrigger aria-label="Distribution" className="max-w-md">
          <SelectValue placeholder="Choisir une distribution" />
        </SelectTrigger>
        <SelectContent>
          {events.map((event) => (
            <SelectItem key={event.id} value={event.id}>
              {event.title} · {event.status === "draft" ? "brouillon" : event.status === "published" ? "publiée" : "clôturée"}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {eventId && <HandoverPanel eventId={eventId} />}
    </div>
  );
}
