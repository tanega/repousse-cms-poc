"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import Link from "next/link";

import { Clock, Download, House, Leaf, Sprout, Users, Warehouse, X } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fetchAllNurseries } from "@/lib/api/nurseries";
import { fetchTaxa, fetchTaxonCategories } from "@/lib/api/taxa";
import type { AdminNursery } from "@/types/nursery";
import type { Taxon, TaxonCategory } from "@/types/taxon";

import {
  buildStockTree,
  downloadCsv,
  findStockNode,
  matchingTaxonIds,
  ownerName,
  pendingLines,
  stockByNurseryCsv,
  stockByTaxonCsv,
  stockKpis,
} from "./data";
import { NurseriesMap } from "./nurseries-map";
import { NurseriesTable, type NurseryRow } from "./nurseries-table";
import { StockTable } from "./stock-table";

const ALL = "__all";

function KpiCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: number }) {
  return (
    <Card data-testid="kpi-card">
      <CardHeader>
        <CardTitle>
          <div className="flex size-7 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
            <Icon className="size-4" />
          </div>
        </CardTitle>
        <CardDescription>{label}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="font-medium text-3xl tabular-nums leading-none tracking-tight">
          {value.toLocaleString("fr-FR")}
        </div>
      </CardContent>
    </Card>
  );
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function FamillesAccueilView() {
  const [taxa, setTaxa] = useState<Taxon[]>([]);
  const [categories, setCategories] = useState<TaxonCategory[]>([]);
  const [nurseries, setNurseries] = useState<AdminNursery[] | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [taxonId, setTaxonId] = useState<string | null>(null);
  const [focusedId, setFocusedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [t, c, n] = await Promise.all([fetchTaxa(), fetchTaxonCategories(), fetchAllNurseries()]);
      setTaxa(t);
      setCategories(c);
      setNurseries(n);
    } catch (err) {
      setNurseries([]);
      toast.error(err instanceof Error ? err.message : "Impossible de charger les nurseries.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const all = useMemo(() => nurseries ?? [], [nurseries]);
  const kpis = useMemo(() => stockKpis(all), [all]);
  const pending = useMemo(() => pendingLines(all), [all]);

  // Category narrows what's counted in the tree; the selected row narrows the
  // map, the nursery list and the exports on top of it.
  const inCategory = useMemo(() => matchingTaxonIds(taxa, { categoryId, taxonId: null }), [taxa, categoryId]);
  const tree = useMemo(() => buildStockTree(taxa, all, inCategory), [taxa, all, inCategory]);
  const matching = useMemo(() => matchingTaxonIds(taxa, { categoryId, taxonId }), [taxa, categoryId, taxonId]);
  const selectedNode = taxonId ? findStockNode(tree, taxonId) : null;

  const rows: NurseryRow[] = useMemo(() => {
    const names = new Map(taxa.map((t) => [t.id, t.common_name]));
    return all
      .map((nursery) => {
        const lines = nursery.plants
          .filter((p) => p.taxon_id && p.quantity > 0 && (!matching || matching.has(p.taxon_id)))
          .map((p) => ({ name: names.get(p.taxon_id as string) ?? "Espèce inconnue", quantity: p.quantity }))
          .sort((a, b) => b.quantity - a.quantity);
        return { nursery, lines, quantity: lines.reduce((sum, l) => sum + l.quantity, 0) };
      })
      .filter((r) => !matching || r.quantity > 0)
      .sort((a, b) =>
        matching ? b.quantity - a.quantity : ownerName(a.nursery.owner).localeCompare(ownerName(b.nursery.owner), "fr"),
      );
  }, [all, taxa, matching]);

  const unlocated = rows.filter((r) => r.nursery.lat == null || r.nursery.lng == null).length;

  // A selected taxon can drop out when the category changes.
  useEffect(() => {
    if (taxonId && nurseries && !selectedNode) setTaxonId(null);
  }, [taxonId, nurseries, selectedNode]);

  useEffect(() => {
    if (focusedId && !rows.some((r) => r.nursery.id === focusedId)) setFocusedId(null);
  }, [focusedId, rows]);

  function exportStock() {
    downloadCsv(`stock-nurseries-par-taxon-${today()}.csv`, stockByTaxonCsv(selectedNode ? [selectedNode] : tree));
  }

  function exportDetail() {
    downloadCsv(
      `stock-nurseries-detail-${today()}.csv`,
      stockByNurseryCsv(
        rows.map((r) => r.nursery),
        taxa,
        matching,
      ),
    );
  }

  const filtered = categoryId !== null || taxonId !== null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-semibold text-2xl">Familles d'accueil & nurseries</h1>
          <p className="mt-1 max-w-2xl text-muted-foreground text-sm">
            Plants conservés dans les nurseries déclarées par les familles d'accueil, pour préparer les prochaines
            distributions.
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={!nurseries}>
              <Download />
              Exporter
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <DropdownMenuLabel className="font-normal text-muted-foreground text-xs">
              {filtered ? "Les filtres actifs s'appliquent." : "Tout le réseau."} Le détail contient des données
              personnelles : usage interne à la préparation des distributions.
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={exportStock}>Stock par taxon (CSV)</DropdownMenuItem>
            <DropdownMenuItem onSelect={exportDetail}>Détail par nurserie, avec contacts (CSV)</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid grid-cols-2 gap-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs md:grid-cols-3 xl:grid-cols-5 dark:*:data-[slot=card]:bg-card">
        {nurseries ? (
          <>
            <KpiCard icon={Sprout} label="Plants disponibles" value={kpis.plants} />
            <KpiCard icon={Warehouse} label="Nurseries actives" value={kpis.nurseries} />
            <KpiCard icon={Users} label="Familles d'accueil" value={kpis.families} />
            <KpiCard icon={Leaf} label="Taxons représentés" value={kpis.taxa} />
            <KpiCard icon={Clock} label="Plants en attente de validation" value={kpis.pendingPlants} />
          </>
        ) : (
          Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={categoryId ?? ALL}
          onValueChange={(v) => {
            setCategoryId(v === ALL ? null : v);
          }}
        >
          <SelectTrigger size="sm" aria-label="Catégorie">
            <span className="text-muted-foreground">Catégorie :</span>
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper" align="start">
            <SelectGroup>
              <SelectItem value={ALL}>Toutes</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        {selectedNode && (
          <Badge variant="secondary" className="gap-1 py-1 pr-1 pl-2" data-testid="selected-taxon">
            Taxon : {selectedNode.taxon.common_name}
            <button
              type="button"
              aria-label="Retirer le filtre taxon"
              className="rounded p-0.5 hover:bg-muted-foreground/20"
              onClick={() => setTaxonId(null)}
            >
              <X className="size-3" />
            </button>
          </Badge>
        )}
        {filtered && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-muted-foreground text-xs"
            onClick={() => {
              setCategoryId(null);
              setTaxonId(null);
            }}
          >
            Réinitialiser
          </Button>
        )}
        {!selectedNode && nurseries && nurseries.length > 0 && (
          <span className="text-muted-foreground text-xs">
            Cliquez sur un taxon pour voir les nurseries qui le conservent.
          </span>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Stocks par taxon</CardTitle>
            <CardDescription>
              Genre → Espèce → Variété : chaque ligne cumule ses descendants. Les nurseries archivées ne sont pas
              comptées.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            {nurseries ? (
              <StockTable tree={tree} selectedTaxonId={taxonId} onSelect={setTaxonId} />
            ) : (
              <div className="flex flex-col gap-2 px-4">
                {Array.from({ length: 6 }, (_, i) => (
                  <Skeleton key={i} className="h-10" />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Carte des nurseries</CardTitle>
            <CardDescription>
              {rows.length - unlocated} nurserie(s) localisée(s)
              {unlocated > 0 && ` · ${unlocated} sans coordonnées (voir la liste)`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[480px]">
              <NurseriesMap rows={rows} focusedId={focusedId} onFocus={setFocusedId} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nurseries{nurseries ? ` (${rows.length})` : ""}</CardTitle>
          <CardDescription>
            {selectedNode
              ? `Nurseries conservant « ${selectedNode.taxon.common_name} » ou un taxon descendant, par quantité.`
              : "Toutes les nurseries actives, profils privés compris. Cliquez sur une ligne pour la situer."}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <NurseriesTable rows={rows} focusedId={focusedId} onFocus={setFocusedId} />
        </CardContent>
      </Card>

      {pending.length > 0 && (
        <Card data-testid="pending-plants">
          <CardHeader>
            <CardTitle>Plants en attente de validation</CardTitle>
            <CardDescription>
              Espèces demandées par les familles et pas encore ajoutées au catalogue : non comptées dans les stocks.{" "}
              <Link href="/admin/especes-vegetales?tab=demandes" className="underline">
                Traiter les demandes d'ajout
              </Link>
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <Table className="**:data-[slot='table-cell']:px-4 **:data-[slot='table-head']:px-4">
              <TableHeader className="[&_tr]:border-t">
                <TableRow>
                  {["Espèce demandée", "Nurserie", "Famille d'accueil"].map((label) => (
                    <TableHead
                      key={label}
                      className="py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide"
                    >
                      {label}
                    </TableHead>
                  ))}
                  <TableHead className="py-3 text-right font-medium text-muted-foreground text-xs uppercase tracking-wide">
                    Plants
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pending.map((line) => (
                  <TableRow key={line.id} className="border-border/60">
                    <TableCell className="py-2.5 font-medium text-sm">{line.label}</TableCell>
                    <TableCell className="py-2.5 text-sm">{line.nursery.name}</TableCell>
                    <TableCell className="py-2.5 text-sm">
                      <span className="inline-flex items-center gap-1.5">
                        <House className="size-3.5 text-muted-foreground" />
                        {ownerName(line.nursery.owner)}
                      </span>
                    </TableCell>
                    <TableCell className="py-2.5 text-right tabular-nums">{line.quantity}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
