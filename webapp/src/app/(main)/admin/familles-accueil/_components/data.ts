import { formatPhone } from "@/lib/phone";
import type { AdminNursery, NurseryOwner } from "@/types/nursery";
import { TAXONOMIC_LEVEL_LABELS, type Taxon, type TaxonCategory } from "@/types/taxon";
import { taxonRequestLabel } from "@/types/taxon-request";

/**
 * Stock view (epic-03 US-PROFIL-15/16/17). Everything here is derived
 * client-side from two payloads: the taxon catalogue and the coordinator
 * nursery listing — the network is small enough that aggregating in the
 * browser keeps filters instant and the backend unchanged.
 */

export interface StockNode {
  taxon: Taxon;
  /** Own category, or the nearest ancestor's when the taxon has none. */
  category: TaxonCategory | null;
  /** Declared directly on this taxon (e.g. "Chêne" at genus level). */
  ownQuantity: number;
  /** ownQuantity plus every descendant's. */
  totalQuantity: number;
  /** Nurseries holding this taxon or a descendant. */
  nurseryIds: string[];
  children?: StockNode[];
}

export interface PendingLine {
  id: string;
  label: string;
  quantity: number;
  nursery: AdminNursery;
}

export interface StockFilters {
  categoryId: string | null;
  /** Selected tree row: narrows to that taxon and its descendants. */
  taxonId: string | null;
}

export function ownerName(owner: NurseryOwner | null): string {
  if (!owner) return "Membre inconnu";
  return [owner.first_name, owner.last_name].filter(Boolean).join(" ") || owner.email;
}

function effectiveCategories(taxa: Taxon[]): Map<string, TaxonCategory | null> {
  const byId = new Map(taxa.map((t) => [t.id, t]));
  const cache = new Map<string, TaxonCategory | null>();
  const resolve = (taxon: Taxon, seen: Set<string>): TaxonCategory | null => {
    const cached = cache.get(taxon.id);
    if (cached !== undefined) return cached;
    let category = taxon.category;
    if (!category && taxon.parent_id && !seen.has(taxon.parent_id)) {
      const parent = byId.get(taxon.parent_id);
      if (parent) category = resolve(parent, seen.add(taxon.id));
    }
    cache.set(taxon.id, category ?? null);
    return category ?? null;
  };
  for (const t of taxa) resolve(t, new Set());
  return cache;
}

/** Taxon ids matching the filters, or null when nothing narrows the stock. */
export function matchingTaxonIds(taxa: Taxon[], filters: StockFilters): Set<string> | null {
  if (!filters.categoryId && !filters.taxonId) return null;
  const categories = effectiveCategories(taxa);
  let ids = taxa.map((t) => t.id);
  if (filters.taxonId) {
    const subtree = new Set([filters.taxonId]);
    // Parents can appear after their children in the payload: loop until stable.
    let grew = true;
    while (grew) {
      grew = false;
      for (const t of taxa) {
        if (t.parent_id && subtree.has(t.parent_id) && !subtree.has(t.id)) {
          subtree.add(t.id);
          grew = true;
        }
      }
    }
    ids = ids.filter((id) => subtree.has(id));
  }
  if (filters.categoryId) ids = ids.filter((id) => categories.get(id)?.id === filters.categoryId);
  return new Set(ids);
}

/** Quantity a nursery holds within the filters (all validated plants when unfiltered). */
export function nurseryQuantity(nursery: AdminNursery, matching: Set<string> | null): number {
  let total = 0;
  for (const p of nursery.plants) {
    if (p.taxon_id && (!matching || matching.has(p.taxon_id))) total += p.quantity;
  }
  return total;
}

/**
 * Genre → Espèce → Variété tree of validated stock, pruned to taxa that have
 * plants somewhere below them. Plants still waiting on a taxon request are
 * left out — see `pendingLines`. `only` restricts the counted plants (e.g. to
 * a category), so cumulated totals honour the filter too.
 */
export function buildStockTree(taxa: Taxon[], nurseries: AdminNursery[], only: Set<string> | null = null): StockNode[] {
  const categories = effectiveCategories(taxa);
  const own = new Map<string, number>();
  const holders = new Map<string, Set<string>>();
  for (const n of nurseries) {
    for (const p of n.plants) {
      if (!p.taxon_id || p.quantity <= 0 || (only && !only.has(p.taxon_id))) continue;
      own.set(p.taxon_id, (own.get(p.taxon_id) ?? 0) + p.quantity);
      if (!holders.has(p.taxon_id)) holders.set(p.taxon_id, new Set());
      holders.get(p.taxon_id)?.add(n.id);
    }
  }

  const children = new Map<string | null, Taxon[]>();
  const ids = new Set(taxa.map((t) => t.id));
  for (const t of taxa) {
    const parent = t.parent_id && ids.has(t.parent_id) ? t.parent_id : null;
    if (!children.has(parent)) children.set(parent, []);
    children.get(parent)?.push(t);
  }

  const build = (taxon: Taxon): StockNode | null => {
    const kids = (children.get(taxon.id) ?? []).map(build).filter((n): n is StockNode => n !== null);
    const ownQuantity = own.get(taxon.id) ?? 0;
    const totalQuantity = ownQuantity + kids.reduce((sum, k) => sum + k.totalQuantity, 0);
    if (totalQuantity === 0) return null;
    const nurseryIds = new Set(holders.get(taxon.id));
    for (const k of kids) for (const id of k.nurseryIds) nurseryIds.add(id);
    return {
      taxon,
      category: categories.get(taxon.id) ?? null,
      ownQuantity,
      totalQuantity,
      nurseryIds: [...nurseryIds],
      children: kids.length ? sortNodes(kids) : undefined,
    };
  };

  return sortNodes((children.get(null) ?? []).map(build).filter((n): n is StockNode => n !== null));
}

function sortNodes(nodes: StockNode[]): StockNode[] {
  return nodes.sort((a, b) => a.taxon.common_name.localeCompare(b.taxon.common_name, "fr"));
}

export function pendingLines(nurseries: AdminNursery[]): PendingLine[] {
  return nurseries.flatMap((nursery) =>
    nursery.plants
      .filter((p) => !p.taxon_id)
      .map((p) => ({
        id: p.id,
        label: p.taxon_request ? taxonRequestLabel(p.taxon_request) : "Plante en attente",
        quantity: p.quantity,
        nursery,
      })),
  );
}

export interface StockKpis {
  plants: number;
  nurseries: number;
  families: number;
  taxa: number;
  pendingPlants: number;
}

export function stockKpis(nurseries: AdminNursery[]): StockKpis {
  const taxa = new Set<string>();
  let plants = 0;
  let pendingPlants = 0;
  for (const n of nurseries) {
    for (const p of n.plants) {
      if (!p.taxon_id) pendingPlants += p.quantity;
      else if (p.quantity > 0) {
        plants += p.quantity;
        taxa.add(p.taxon_id);
      }
    }
  }
  return {
    plants,
    nurseries: nurseries.length,
    families: new Set(nurseries.map((n) => n.user_id)).size,
    taxa: taxa.size,
    pendingPlants,
  };
}

// ── CSV exports (US-PROFIL-17) ────────────────────────────────────────────

function csvCell(value: string | number | null | undefined): string {
  const s = value == null ? "" : String(value);
  return /[";\n\r]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
}

/** `;`-separated with a BOM, so Excel in a French locale opens it with accents intact. */
export function toCsv(header: string[], rows: (string | number | null | undefined)[][]): string {
  return `﻿${[header, ...rows].map((r) => r.map(csvCell).join(";")).join("\r\n")}\r\n`;
}

export function downloadCsv(filename: string, csv: string) {
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function findStockNode(tree: StockNode[], taxonId: string): StockNode | null {
  for (const n of tree) {
    if (n.taxon.id === taxonId) return n;
    const found = n.children ? findStockNode(n.children, taxonId) : null;
    if (found) return found;
  }
  return null;
}

/** One row per tree node, parents before children. */
export function stockByTaxonCsv(tree: StockNode[]): string {
  const rows: (string | number)[][] = [];
  const walk = (nodes: StockNode[], parent: string) => {
    for (const n of nodes) {
      rows.push([
        n.taxon.common_name,
        n.taxon.scientific_name ?? "",
        TAXONOMIC_LEVEL_LABELS[n.taxon.taxonomic_level],
        parent,
        n.category?.name ?? "",
        n.ownQuantity,
        n.totalQuantity,
        n.nurseryIds.length,
      ]);
      if (n.children) walk(n.children, n.taxon.common_name);
    }
  };
  walk(tree, "");
  return toCsv(
    [
      "Taxon",
      "Nom scientifique",
      "Niveau",
      "Parent",
      "Catégorie",
      "Quantité déclarée à ce niveau",
      "Quantité cumulée",
      "Nurseries",
    ],
    rows,
  );
}

export function stockByNurseryCsv(nurseries: AdminNursery[], taxa: Taxon[], matching: Set<string> | null): string {
  const byId = new Map(taxa.map((t) => [t.id, t]));
  const rows = nurseries.flatMap((n) =>
    n.plants
      .filter((p) => p.taxon_id && (!matching || matching.has(p.taxon_id)))
      .map((p) => {
        const taxon = p.taxon_id ? byId.get(p.taxon_id) : undefined;
        return [
          ownerName(n.owner),
          n.owner?.email ?? "",
          formatPhone(n.owner?.phone),
          n.name,
          n.address ?? "",
          taxon?.common_name ?? "Espèce inconnue",
          taxon?.scientific_name ?? "",
          p.quantity,
          p.note ?? "",
        ];
      }),
  );
  return toCsv(
    ["Famille d'accueil", "Email", "Téléphone", "Nurserie", "Adresse", "Taxon", "Nom scientifique", "Quantité", "Note"],
    rows,
  );
}
