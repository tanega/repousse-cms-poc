"use client";
"use no memo";

import type { ColumnDef, Row } from "@tanstack/react-table";
import { ArrowUpDown, ChevronRight, ExternalLink, MoreHorizontal } from "lucide-react";

import Link from "next/link";

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

import { CATEGORIE_COLORS, NIVEAU_COLORS, type TaxonNode } from "./data";
import type { DeleteTarget } from "./delete-alert-dialog";

function ExpandButton({ row }: { row: Row<TaxonNode> }) {
  if (!row.getCanExpand()) return <span className="inline-block size-5" />;
  return (
    <button
      type="button"
      className="inline-flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      onClick={row.getToggleExpandedHandler()}
    >
      <ChevronRight
        className={cn("size-4 transition-transform duration-150", row.getIsExpanded() && "rotate-90")}
      />
    </button>
  );
}

export function getTaxonsColumns(onDelete: (target: DeleteTarget) => void): ColumnDef<TaxonNode>[] {
  return [
    {
      id: "search",
      accessorFn: (row) =>
        `${row.nomCommun} ${row.nomScientifique ?? ""}`.toLowerCase(),
      filterFn: "includesString",
      enableHiding: true,
    },
    {
      id: "nom",
      accessorKey: "nomCommun",
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
          <div
            className="flex items-center gap-2"
            style={{ paddingLeft: `${row.depth * 24}px` }}
          >
            <ExpandButton row={row} />
            {taxon.imageUrl ? (
              <img
                src={taxon.imageUrl}
                alt={taxon.nomCommun}
                className="size-8 shrink-0 rounded object-cover"
              />
            ) : (
              <span className="size-8 shrink-0 rounded bg-muted" />
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <Link
                  href={`/admin/especes-vegetales/${encodeURIComponent(taxon.id)}`}
                  className="truncate font-medium text-foreground text-sm hover:underline"
                >
                  {taxon.nomCommun}
                </Link>
                {taxon.nonTaxonomique && (
                  <Badge
                    variant="outline"
                    className="shrink-0 border-dashed px-1.5 py-0 text-xs font-normal text-muted-foreground"
                  >
                    non-tax.
                  </Badge>
                )}
              </div>
              {taxon.nomScientifique && (
                <span className="italic text-muted-foreground text-xs">
                  {taxon.nomScientifique}
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "niveau",
      header: "Niveau",
      filterFn: "equalsString",
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={cn(
            "border-0 px-2 py-0.5 text-xs font-normal",
            NIVEAU_COLORS[row.original.niveau],
          )}
        >
          {row.original.niveau}
        </Badge>
      ),
    },
    {
      accessorKey: "categorie",
      header: "Catégorie",
      filterFn: "equalsString",
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={cn(
            "border-0 px-2 py-0.5 text-xs font-normal",
            CATEGORIE_COLORS[row.original.categorie],
          )}
        >
          {row.original.categorie}
        </Badge>
      ),
    },
    {
      id: "utilisations",
      header: "Utilisations",
      cell: ({ row }) => {
        const { nbDistributions, nbProjets } = row.original;
        if (nbDistributions + nbProjets === 0)
          return <span className="text-muted-foreground text-xs">—</span>;
        return (
          <div className="text-xs text-muted-foreground">
            {nbDistributions > 0 && <span>{nbDistributions} distrib.</span>}
            {nbDistributions > 0 && nbProjets > 0 && <span> · </span>}
            {nbProjets > 0 && (
              <span>
                {nbProjets} projet{nbProjets > 1 ? "s" : ""}
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
        const count = row.original.liens.length;
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
        const isUsed = taxon.nbDistributions > 0 || taxon.nbProjets > 0;
        return (
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  aria-label={`Actions pour ${taxon.nomCommun}`}
                  className="size-8 rounded-md text-muted-foreground hover:bg-muted/50"
                  size="icon-sm"
                  variant="ghost"
                >
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link
                    href={`/admin/especes-vegetales/${encodeURIComponent(taxon.id)}/modifier`}
                  >
                    Modifier
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href={`/admin/especes-vegetales/nouveau?parentId=${encodeURIComponent(taxon.id)}`}
                  >
                    Ajouter un taxon enfant
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => onDelete({ taxon, hasChildren, isUsed })}
                >
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
