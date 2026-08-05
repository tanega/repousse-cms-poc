export type TaxonomicLevel = "genus" | "species" | "variety";

export interface TaxonCategory {
  id: string;
  name: string;
  slug: string;
  inserted_at: string;
  updated_at: string;
}

export interface TaxonExternalLink {
  id: string;
  source_name: string;
  url: string;
  taxon_id: string;
  inserted_at: string;
  updated_at: string;
}

export interface Taxon {
  id: string;
  scientific_name: string | null;
  common_name: string;
  taxonomic_level: TaxonomicLevel;
  is_non_taxonomic: boolean;
  notes: string | null;
  image_url: string | null;
  parent_id: string | null;
  category_id: string | null;
  category: TaxonCategory | null;
  external_links: TaxonExternalLink[];
  nb_distributions: number;
  nb_projets: number;
  inserted_at: string;
  updated_at: string;
}

/** Taxon with its descendants nested, for tree-shaped UI (table sub-rows, breadcrumbs). */
export type TaxonNode = Taxon & { children?: TaxonNode[] };

export const TAXONOMIC_LEVELS: TaxonomicLevel[] = ["genus", "species", "variety"];

export const TAXONOMIC_LEVEL_LABELS: Record<TaxonomicLevel, string> = {
  genus: "Genre",
  species: "Espèce",
  variety: "Variété/Cultivar",
};

export const TAXONOMIC_LEVEL_COLORS: Record<TaxonomicLevel, string> = {
  genus: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  species: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  variety: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
};

export const EXTERNAL_LINK_SOURCES = [
  "Floriscope",
  "Wikipedia",
  "Wikidata",
  "Encyclopedia of Life",
  "DoPI",
  "GloBI",
  "Other",
];

/**
 * Categories are an admin-manageable table (not a fixed enum), so colors are
 * derived from a stable hash of the slug instead of a hardcoded per-name map.
 */
const CATEGORY_COLOR_PALETTE = [
  "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  "bg-lime-100 text-lime-800 dark:bg-lime-900/30 dark:text-lime-300",
  "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300",
  "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300",
  "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
];

export function categoryColorClass(slug: string): string {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) hash = (hash * 31 + slug.charCodeAt(i)) | 0;
  return CATEGORY_COLOR_PALETTE[Math.abs(hash) % CATEGORY_COLOR_PALETTE.length];
}

/** Rebuild the Genre → Espèce → Variété/Cultivar hierarchy from flat `parent_id` rows. */
export function buildTaxonTree(rows: Taxon[]): TaxonNode[] {
  const byId = new Map<string, TaxonNode>(rows.map((r) => [r.id, { ...r }]));
  const roots: TaxonNode[] = [];
  for (const node of byId.values()) {
    if (node.parent_id && byId.has(node.parent_id)) {
      const parent = byId.get(node.parent_id)!;
      parent.children ??= [];
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

export function findTaxonById(id: string, rows: Taxon[]): Taxon | null {
  return rows.find((r) => r.id === id) ?? null;
}

export function findTaxonAncestors(id: string, rows: Taxon[]): Taxon[] {
  const byId = new Map(rows.map((r) => [r.id, r]));
  const path: Taxon[] = [];
  let current = byId.get(id);
  while (current?.parent_id) {
    const parent = byId.get(current.parent_id);
    if (!parent) break;
    path.unshift(parent);
    current = parent;
  }
  return path;
}

export function findTaxonChildren(id: string, rows: Taxon[]): Taxon[] {
  return rows.filter((r) => r.parent_id === id);
}

/** `id` plus every descendant id, for cascade delete. */
export function collectTaxonWithDescendants(id: string, rows: Taxon[]): string[] {
  const ids = [id];
  for (let i = 0; i < ids.length; i++) {
    for (const row of rows) {
      if (row.parent_id === ids[i]) ids.push(row.id);
    }
  }
  return ids;
}
