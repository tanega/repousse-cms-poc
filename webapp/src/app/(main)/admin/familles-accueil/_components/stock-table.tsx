"use client";
"use no memo";

import * as React from "react";

import {
  type ColumnDef,
  type ExpandedState,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  type Row,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronRight, ChevronsDownUp, ChevronsUpDown, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { categoryColorClass, TAXONOMIC_LEVEL_LABELS } from "@/types/taxon";

import type { StockNode } from "./data";

function ExpandButton({ row }: { row: Row<StockNode> }) {
  if (!row.getCanExpand()) return <span className="inline-block size-5" />;
  return (
    <button
      type="button"
      aria-label={row.getIsExpanded() ? "Réduire" : "Développer"}
      className="inline-flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      onClick={(e) => {
        // The row itself selects the taxon — expanding shouldn't.
        e.stopPropagation();
        row.toggleExpanded();
      }}
    >
      <ChevronRight className={cn("size-4 transition-transform duration-150", row.getIsExpanded() && "rotate-90")} />
    </button>
  );
}

const HIDDEN_COLUMNS = { search: false };

const columns: ColumnDef<StockNode>[] = [
  {
    id: "search",
    accessorFn: (n) => `${n.taxon.common_name} ${n.taxon.scientific_name ?? ""}`.toLowerCase(),
    filterFn: "includesString",
  },
  {
    id: "taxon",
    header: "Taxon",
    cell: ({ row }) => {
      const { taxon } = row.original;
      return (
        <div className="flex items-center gap-2" style={{ paddingLeft: `${row.depth * 24}px` }}>
          <ExpandButton row={row} />
          <div className="min-w-0">
            <div className="font-medium text-sm">{taxon.common_name}</div>
            <div className="flex flex-wrap items-center gap-x-1.5 text-muted-foreground text-xs">
              <span>{TAXONOMIC_LEVEL_LABELS[taxon.taxonomic_level]}</span>
              {taxon.scientific_name && <span className="italic">· {taxon.scientific_name}</span>}
            </div>
          </div>
        </div>
      );
    },
  },
  {
    id: "categorie",
    header: "Catégorie",
    cell: ({ row }) => {
      const { category } = row.original;
      if (!category) return <span className="text-muted-foreground text-xs">—</span>;
      return (
        <Badge variant="secondary" className={cn("font-normal", categoryColorClass(category.slug))}>
          {category.name}
        </Badge>
      );
    },
  },
  {
    id: "quantite",
    header: () => <div className="text-right">Plants</div>,
    cell: ({ row }) => {
      const n = row.original;
      return (
        <div className="text-right">
          <div className="font-medium tabular-nums">{n.totalQuantity.toLocaleString("fr-FR")}</div>
          {n.children && n.ownQuantity > 0 && (
            // Plants only identified down to this level (e.g. "Chêne" for a mixed lot).
            <div className="text-muted-foreground text-xs tabular-nums">
              dont {n.ownQuantity.toLocaleString("fr-FR")} sans précision
            </div>
          )}
        </div>
      );
    },
  },
  {
    id: "nurseries",
    header: () => <div className="text-right">Nurseries</div>,
    cell: ({ row }) => <div className="text-right tabular-nums">{row.original.nurseryIds.length}</div>,
  },
];

export function StockTable({
  tree,
  selectedTaxonId,
  onSelect,
}: {
  tree: StockNode[];
  selectedTaxonId: string | null;
  onSelect: (taxonId: string | null) => void;
}) {
  const [expanded, setExpanded] = React.useState<ExpandedState>({});
  const [search, setSearch] = React.useState("");
  // Stable identities: a fresh array/object per render makes the filtered row
  // model recompute, which auto-resets table state and re-renders — forever.
  const columnFilters = React.useMemo(() => (search ? [{ id: "search", value: search.toLowerCase() }] : []), [search]);

  const table = useReactTable({
    data: tree,
    columns,
    state: {
      expanded,
      columnVisibility: HIDDEN_COLUMNS,
      columnFilters,
    },
    getRowId: (n) => n.taxon.id,
    getSubRows: (n) => n.children,
    filterFromLeafRows: true,
    autoResetExpanded: false,
    autoResetPageIndex: false,
    onExpandedChange: setExpanded,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
  });

  const rows = table.getRowModel().rows;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4">
        <InputGroup className="h-7 w-full md:w-64">
          <InputGroupAddon align="inline-start">
            <Search className="size-3.5" />
          </InputGroupAddon>
          <InputGroupInput
            className="h-7"
            placeholder="Rechercher un taxon…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              if (e.target.value) setExpanded(true);
            }}
          />
        </InputGroup>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 text-muted-foreground text-xs"
            onClick={() => setExpanded(true)}
          >
            <ChevronsUpDown className="size-3.5" />
            Développer tout
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 text-muted-foreground text-xs"
            onClick={() => setExpanded({})}
          >
            <ChevronsDownUp className="size-3.5" />
            Réduire tout
          </Button>
        </div>
      </div>

      <Table className="**:data-[slot='table-cell']:px-4 **:data-[slot='table-head']:px-4">
        <TableHeader className="[&_tr]:border-t">
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id}>
              {hg.headers.map((h) => (
                <TableHead
                  key={h.id}
                  className="py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide"
                >
                  {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {rows.length ? (
            rows.map((row) => {
              const selected = row.id === selectedTaxonId;
              return (
                <TableRow
                  key={row.id}
                  data-testid="stock-row"
                  data-state={selected ? "selected" : undefined}
                  aria-selected={selected}
                  className="cursor-pointer border-border/60"
                  onClick={() => onSelect(selected ? null : row.id)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="whitespace-normal py-2.5 align-middle">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell colSpan={4} className="h-24 text-center text-muted-foreground text-sm">
                {tree.length ? "Aucun taxon ne correspond à la recherche." : "Aucun plant déclaré pour ces critères."}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
