"use client";

import { useEffect, useState } from "react";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createGift, createHedge, fetchImpact, type Gift, type Hedge, type ImpactSummary } from "@/lib/api/impact";
import { fetchPublicTaxa } from "@/lib/api/taxa";
import type { Taxon } from "@/types/taxon";

export default function ImpactPage() {
  const [summary, setSummary] = useState<ImpactSummary | null>(null);
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [hedges, setHedges] = useState<Hedge[]>([]);
  const [taxa, setTaxa] = useState<Taxon[]>([]);
  const [giftTaxon, setGiftTaxon] = useState("");
  const [giftQty, setGiftQty] = useState("10");
  const [giftNote, setGiftNote] = useState("");
  const [hedgeName, setHedgeName] = useState("");
  const [hedgeLength, setHedgeLength] = useState("");
  const [hedgeReinforced, setHedgeReinforced] = useState("");
  const [hedgeYear, setHedgeYear] = useState("");
  const [hedgeTrees, setHedgeTrees] = useState("");
  const [hedgeCommune, setHedgeCommune] = useState("");
  const [hedgeRate, setHedgeRate] = useState("");

  async function load() {
    const payload = await fetchImpact();
    setSummary(payload.data);
    setGifts(payload.gifts);
    setHedges(payload.hedges);
  }

  useEffect(() => {
    load().catch((err) => toast.error(err instanceof Error ? err.message : "Impossible de charger l'impact."));
    fetchPublicTaxa()
      .then(setTaxa)
      .catch(() => setTaxa([]));
  }, []);

  async function saveGift() {
    const quantity = Number(giftQty);
    if (!giftTaxon || !Number.isInteger(quantity) || quantity < 1) {
      toast.error("Choisissez une espèce et une quantité.");
      return;
    }
    try {
      await createGift({ taxon_id: giftTaxon, quantity, note: giftNote || undefined });
      setGiftNote("");
      toast.success("Arbres déjà offerts enregistrés.");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec de l'enregistrement.");
    }
  }

  async function saveHedge() {
    const rate = hedgeRate.trim() ? Number(hedgeRate) : null;
    const length = hedgeLength.trim() ? Number(hedgeLength) : null;
    if (hedgeName.trim().length < 2) {
      toast.error("Donnez un nom à la haie.");
      return;
    }
    try {
      await createHedge({
        name: hedgeName.trim(),
        length_m: length,
        reinforced_length_m: hedgeReinforced.trim() ? Number(hedgeReinforced) : null,
        tree_count: hedgeTrees.trim() ? Number(hedgeTrees) : null,
        commune: hedgeCommune.trim() || null,
        planted_on: hedgeYear.trim() ? `${hedgeYear.trim()}-01-01` : null,
        survival_rate: rate,
      });
      setHedgeName("");
      setHedgeLength("");
      setHedgeReinforced("");
      setHedgeYear("");
      setHedgeTrees("");
      setHedgeCommune("");
      setHedgeRate("");
      toast.success("Haie enregistrée.");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec de l'enregistrement.");
    }
  }

  return (
    <div className="@container/main flex flex-col gap-6">
      <div>
        <h1 className="font-semibold text-2xl">Impact</h1>
        <p className="mt-1 max-w-2xl text-muted-foreground text-sm">{summary?.note}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Arbres donnés</CardTitle>
          </CardHeader>
          <CardContent className="font-semibold text-3xl tabular-nums">{summary?.trees_given ?? "—"}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Haies</CardTitle>
          </CardHeader>
          <CardContent className="font-semibold text-3xl tabular-nums">{summary?.hedge_count ?? "—"}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Reprise moyenne</CardTitle>
          </CardHeader>
          <CardContent className="font-semibold text-3xl tabular-nums">
            {summary?.mean_survival_rate == null ? "—" : `${summary.mean_survival_rate} %`}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Arbres déjà offerts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {gifts.map((gift) => (
            <p key={gift.id} className="text-sm">
              {gift.quantity} {gift.common_name ?? "arbres"}
              {gift.note ? ` — ${gift.note}` : ""}
            </p>
          ))}
          <div className="flex flex-wrap items-end gap-2">
            <div className="min-w-48 flex-1">
              <Label>Espèce</Label>
              <Select value={giftTaxon} onValueChange={setGiftTaxon}>
                <SelectTrigger aria-label="Espèce déjà offerte">
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
            <div>
              <Label htmlFor="gift-qty">Quantité</Label>
              <Input id="gift-qty" type="number" min={1} className="w-24" value={giftQty} onChange={(e) => setGiftQty(e.target.value)} />
            </div>
            <div className="min-w-48 flex-1">
              <Label htmlFor="gift-note">Note</Label>
              <Input id="gift-note" value={giftNote} onChange={(e) => setGiftNote(e.target.value)} />
            </div>
            <Button onClick={saveGift}>Enregistrer</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Haies plantées</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {hedges.map((hedge) => (
            <p key={hedge.id} className="text-sm">
              {hedge.name}
              {hedge.length_m ? ` — linéaire créé ${hedge.length_m} m` : ""}
              {hedge.reinforced_length_m ? ` — renforcé ${hedge.reinforced_length_m} m` : ""}
              {hedge.tree_count ? ` — ${hedge.tree_count} arbres` : ""}
              {hedge.commune ? ` — ${hedge.commune}` : ""}
              {hedge.planted_on ? ` — ${hedge.planted_on.slice(0, 4)}` : ""}
              {hedge.survival_rate != null ? ` — reprise ${hedge.survival_rate} %` : ""}
            </p>
          ))}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="hedge-name">Nom</Label>
              <Input id="hedge-name" value={hedgeName} onChange={(e) => setHedgeName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="hedge-length">Linéaire créé (m)</Label>
              <Input id="hedge-length" type="number" min={0} value={hedgeLength} onChange={(e) => setHedgeLength(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="hedge-reinforced">Linéaire renforcé (m)</Label>
              <Input id="hedge-reinforced" type="number" min={0} value={hedgeReinforced} onChange={(e) => setHedgeReinforced(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="hedge-year">Année de plantation</Label>
              <Input id="hedge-year" type="number" min={1990} max={2100} value={hedgeYear} onChange={(e) => setHedgeYear(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="hedge-trees">Nombre d'arbres plantés</Label>
              <Input id="hedge-trees" type="number" min={0} value={hedgeTrees} onChange={(e) => setHedgeTrees(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="hedge-commune">Commune ou adresse</Label>
              <Input id="hedge-commune" value={hedgeCommune} onChange={(e) => setHedgeCommune(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="hedge-rate">Reprise (%)</Label>
              <Input id="hedge-rate" type="number" min={0} max={100} value={hedgeRate} onChange={(e) => setHedgeRate(e.target.value)} />
            </div>
          </div>
          <Button onClick={saveHedge}>Enregistrer la haie</Button>
        </CardContent>
      </Card>
    </div>
  );
}
