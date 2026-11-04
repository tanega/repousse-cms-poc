"use client";

import { useEffect, useState } from "react";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { fetchHandovers, recordHandover, type HandoverRow } from "@/lib/api/handover";

function personName(row: HandoverRow) {
  const name = [row.user.first_name, row.user.last_name].filter(Boolean).join(" ");
  return name || row.user.email;
}

export function HandoverPanel({ eventId }: { eventId: string }) {
  const [rows, setRows] = useState<HandoverRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchHandovers(eventId)
      .then((data) => {
        if (cancelled) return;
        setRows(data);
        const initial: Record<string, string> = {};
        for (const row of data) {
          for (const item of row.items) {
            initial[`${row.id}:${item.taxon_id}`] = String(item.distributed_qty ?? item.reserved_qty);
          }
        }
        setQuantities(initial);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Impossible de charger les réservations.");
      });
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  async function save(row: HandoverRow) {
    const items = row.items
      .map((item) => ({
        taxon_id: item.taxon_id,
        quantity: Number(quantities[`${row.id}:${item.taxon_id}`] ?? 0),
      }))
      .filter((item) => item.quantity > 0);

    setBusyId(row.id);
    try {
      await recordHandover(eventId, row.id, items);
      toast.success(`Remise enregistrée pour ${personName(row)}.`);
      setRows((current) => current?.map((entry) => (entry.id === row.id ? { ...entry, status: "validated" } : entry)) ?? current);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec de l'enregistrement.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Remise du jour</CardTitle>
        <CardDescription>
          Indiquez ce que chaque adoptant a réellement récupéré. Les quantités s'ajoutent à son projet de plantation.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <p className="text-destructive text-sm">{error}</p>}
        {rows && rows.length === 0 && <p className="text-muted-foreground text-sm">Aucune réservation pour cette distribution.</p>}
        {rows?.map((row) => (
          <div key={row.id} className="space-y-2 rounded-lg border p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium text-sm">{personName(row)}</p>
              <p className="text-muted-foreground text-xs">{row.status === "validated" ? "Déjà enregistré" : "En attente"}</p>
            </div>
            {row.items.map((item) => (
              <label key={item.taxon_id} className="flex items-center justify-between gap-3 text-sm">
                <span>
                  {item.common_name ?? "Espèce"}
                  <span className="ml-2 text-muted-foreground text-xs">réservé : {item.reserved_qty}</span>
                </span>
                <Input
                  type="number"
                  min={0}
                  className="w-24"
                  aria-label={`Quantité récupérée de ${item.common_name ?? "cette espèce"}`}
                  value={quantities[`${row.id}:${item.taxon_id}`] ?? ""}
                  disabled={row.status !== "confirmed"}
                  onChange={(event) =>
                    setQuantities((current) => ({ ...current, [`${row.id}:${item.taxon_id}`]: event.target.value }))
                  }
                />
              </label>
            ))}
            {row.status === "confirmed" && (
              <Button size="sm" disabled={busyId === row.id} onClick={() => save(row)}>
                {busyId === row.id ? "Enregistrement…" : "Enregistrer la remise"}
              </Button>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
