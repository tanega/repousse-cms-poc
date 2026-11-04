"use client";

import { useEffect, useState } from "react";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetchEvents } from "@/lib/api/distributions";
import {
  allocateDepositsToEvent,
  createDirectDeposit,
  deleteDeposit,
  fetchCleDesChamps,
  updateDepositQuantity,
  type CleDesChampsDeposit,
} from "@/lib/api/nurseries";
import { fetchPublicTaxa } from "@/lib/api/taxa";
import type { DistributionEvent } from "@/types/distribution";
import type { Taxon } from "@/types/taxon";

export default function CleDesChampsPage() {
  const [deposits, setDeposits] = useState<CleDesChampsDeposit[]>([]);
  const [archive, setArchive] = useState<CleDesChampsDeposit[]>([]);
  const [events, setEvents] = useState<DistributionEvent[]>([]);
  const [taxa, setTaxa] = useState<Taxon[]>([]);
  const [eventId, setEventId] = useState("");
  const [taxonId, setTaxonId] = useState("");
  const [quantity, setQuantity] = useState("10");
  const [busy, setBusy] = useState(false);

  async function load() {
    const [stock, list, species] = await Promise.all([fetchCleDesChamps(), fetchEvents(), fetchPublicTaxa()]);
    setDeposits(stock.data);
    setArchive(stock.archive);
    setEvents(list);
    setTaxa(species);
  }

  useEffect(() => {
    load().catch((err) => toast.error(err instanceof Error ? err.message : "Impossible de charger le stock."));
  }, []);

  const totals = deposits.reduce<Record<string, { name: string; quantity: number }>>((acc, deposit) => {
    const key = deposit.taxon_id;
    const current = acc[key] ?? { name: deposit.common_name ?? "Espèce", quantity: 0 };
    current.quantity += deposit.quantity;
    acc[key] = current;
    return acc;
  }, {});

  async function pour() {
    if (!eventId) {
      toast.error("Choisissez une distribution.");
      return;
    }
    setBusy(true);
    try {
      await allocateDepositsToEvent(eventId);
      toast.success("Stock versé dans la distribution.");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec du versement.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="@container/main flex flex-col gap-6">
      <div>
        <h1 className="font-semibold text-2xl">Dispo à la clé des champs</h1>
        <p className="mt-1 text-muted-foreground text-sm">
          Arbres déposés par les familles d'accueil, prêts à être mis en distribution.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Stock disponible</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {Object.keys(totals).length === 0 && <p className="text-muted-foreground">Aucun arbre déposé pour l'instant.</p>}
          {Object.entries(totals).map(([id, row]) => (
            <p key={id} className="flex justify-between">
              <span>{row.name}</span>
              <span className="font-medium tabular-nums">{row.quantity}</span>
            </p>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Détail des dépôts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {deposits.map((deposit) => (
            <p key={deposit.id}>
              {deposit.quantity} {deposit.common_name ?? "arbre"} — {deposit.owner_name || deposit.owner_email || "famille d'accueil"}
            </p>
          ))}
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-64">
          <Select value={eventId} onValueChange={setEventId}>
            <SelectTrigger aria-label="Distribution">
              <SelectValue placeholder="Choisir une distribution" />
            </SelectTrigger>
            <SelectContent>
              {events.map((event) => (
                <SelectItem key={event.id} value={event.id}>
                  {event.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button disabled={busy || deposits.length === 0} onClick={pour}>
          {busy ? "Versement…" : "Verser ce stock dans la distribution"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Arrivée directe, sans famille d'accueil</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-2">
          <div className="min-w-48 flex-1">
            <Select value={taxonId} onValueChange={setTaxonId}>
              <SelectTrigger aria-label="Espèce arrivée directement">
                <SelectValue placeholder="Espèce" />
              </SelectTrigger>
              <SelectContent>
                {taxa.map((taxon) => (
                  <SelectItem key={taxon.id} value={taxon.id}>
                    {taxon.common_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Input type="number" min={1} className="w-24" aria-label="Quantité arrivée" value={quantity} onChange={(event) => setQuantity(event.target.value)} />
          <Button
            onClick={async () => {
              const qty = Number(quantity);
              if (!taxonId || !Number.isInteger(qty) || qty < 1) {
                toast.error("Choisissez une espèce et une quantité.");
                return;
              }
              await createDirectDeposit(taxonId, qty);
              toast.success("Stock ajouté.");
              await load();
            }}
          >
            Ajouter au stock
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Déjà versés en distribution</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {archive.length === 0 && <p className="text-muted-foreground">Aucune archive pour l'instant.</p>}
          {archive.map((deposit) => (
            <p key={deposit.id}>
              {deposit.quantity} {deposit.common_name ?? "arbre"}
            </p>
          ))}
        </CardContent>
      </Card>

      <div className="space-y-2">
        {deposits.map((deposit) => (
          <div key={deposit.id} className="flex flex-wrap items-center gap-2 text-sm">
            <span className="min-w-40">{deposit.common_name}</span>
            <Input
              type="number"
              min={1}
              className="w-24"
              defaultValue={deposit.quantity}
              aria-label={`Quantité de ${deposit.common_name}`}
              onBlur={async (event) => {
                const next = Number(event.target.value);
                if (next !== deposit.quantity && next > 0) {
                  await updateDepositQuantity(deposit.id, next);
                  await load();
                }
              }}
            />
            <Button variant="outline" size="sm" onClick={async () => { await deleteDeposit(deposit.id); await load(); }}>
              Retirer
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
