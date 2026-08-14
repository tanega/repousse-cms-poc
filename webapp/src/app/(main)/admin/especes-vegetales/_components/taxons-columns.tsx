"use client";
"use no memo";

import Link from "next/link";

import type { ColumnDef, Row } from "@tanstack/react-table";
import { ArrowUpDown, ChevronRight, ExternalLink, MoreHorizontal } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { categoryColorClass, TAXONOMIC_LEVEL_COLORS, TAXONOMIC_LEVEL_LABELS, type TaxonNode } from "@/types/taxon";

import type { DeleteTarget } from "./delete-alert-dialog";

function ExpandButton({ row }: { row: Row<TaxonNode> }) {
  if (!row.getCanExpand()) return <span className="inline-block size-5" />;
  return (
    <button
      type="button"
      className="inline-flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      onClick={row.getToggleExpandedHandler()}
    >
      <ChevronRight className={cn("size-4 transition-transform duration-150", row.getIsExpanded() && "rotate-90")} />
    </button>
  );
}

export function getTaxonsColumns(onDelete: (target: DeleteTarget) => void): ColumnDef<TaxonNode>[] {
  return [
    {
      id: "search",
      accessorFn: (row) => `${row.common_name} ${row.scientific_name ?? ""}`.toLowerCase(),
      filterFn: "includesString",
      enableHiding: true,
    },
    {
      id: "nom",
      accessorKey: "common_name",
      header: ({ column }) => (
        <button
          type="button"
          className="flex items-center gap-1 text-muted-foreground text-xs font-medium uppercase tracking-wide hover:text-foreground"
          onClick={() => column.toggleSorting()}
        >
          Taxon
          <ArrowUpDown className="size-3.5" />
        </button>
      ),
      cell: ({ row }) => {
        const taxon = row.original;
        return (
          <div className="flex items-center gap-2" style={{ paddingLeft: `${row.depth * 24}px` }}>
            <ExpandButton row={row} />
            {taxon.image_url ? (
              <img src={taxon.image_url} alt={taxon.common_name} className="size-8 shrink-0 rounded object-cover" />
            ) : (
              <span className="size-8 shrink-0 rounded bg-muted" />
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <Link
                  href={`/admin/especes-vegetales/${encodeURIComponent(taxon.id)}`}
                  className="truncate font-medium text-foreground text-sm hover:underline"
                >
                  {taxon.common_name}
                </Link>
                {taxon.is_non_taxonomic && (
                  <Badge
                    variant="outline"
                    className="shrink-0 border-dashed px-1.5 py-0 text-xs font-normal text-muted-foreground"
                  >
                    non-tax.
                  </Badge>
                )}
              </div>
              {taxon.scientific_name && (
                <span className="italic text-muted-foreground text-xs">{taxon.scientific_name}</span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "taxonomic_level",
      header: "Niveau",
      filterFn: "equalsString",
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={cn(
            "border-0 px-2 py-0.5 text-xs font-normal",
            TAXONOMIC_LEVEL_COLORS[row.original.taxonomic_level],
          )}
        >
          {TAXONOMIC_LEVEL_LABELS[row.original.taxonomic_level]}
        </Badge>
      ),
    },
    {
      id: "categorie",
      accessorFn: (row) => row.category?.name ?? "",
      header: "Catégorie",
      filterFn: "equalsString",
      cell: ({ row }) => {
        const category = row.original.category;
        if (!category) return <span className="text-muted-foreground text-xs">—</span>;
        return (
          <Badge
            variant="outline"
            className={cn("border-0 px-2 py-0.5 text-xs font-normal", categoryColorClass(category.slug))}
          >
            {category.name}
          </Badge>
        );
      },
    },
    {
      id: "utilisations",
      header: "Utilisations",
      cell: ({ row }) => {
        const { nb_distributions, nb_projets } = row.original;
        if (nb_distributions + nb_projets === 0) return <span className="text-muted-foreground text-xs">—</span>;
        return (
          <div className="text-xs text-muted-foreground">
            {nb_distributions > 0 && <span>{nb_distributions} distrib.</span>}
            {nb_distributions > 0 && nb_projets > 0 && <span> · </span>}
            {nb_projets > 0 && (
              <span>
                {nb_projets} projet{nb_projets > 1 ? "s" : ""}
              </span>
            )}
          </div>
        );
      },
    },
    {
      id: "liens",
      header: "Liens",
      cell: ({ row }) => {
        const count = row.original.external_links?.length ?? 0;
        if (count === 0) return <span className="text-muted-foreground text-xs">—</span>;
        return (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <ExternalLink className="size-3" />
            {count}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      enableHiding: false,
      enableSorting: false,
      cell: ({ row }) => {
        const taxon = row.original;
        const hasChildren = (taxon.children?.length ?? 0) > 0;
        const isUsed = taxon.nb_distributions > 0 || taxon.nb_projets > 0;
        return (
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  aria-label={`Actions pour ${taxon.common_name}`}
                  className="size-8 rounded-md text-muted-foreground hover:bg-muted/50"
                  size="icon-sm"
                  variant="ghost"
                >
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/admin/especes-vegetales/${encodeURIComponent(taxon.id)}/modifier`}>Modifier</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/admin/especes-vegetales/nouveau?parentId=${encodeURIComponent(taxon.id)}`}>
                    Ajouter un taxon enfant
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={() => onDelete({ taxon, hasChildren, isUsed })}>
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];
}
