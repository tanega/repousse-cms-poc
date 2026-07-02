"use client";
"use no memo";

import * as React from "react";

import Link from "next/link";

import {
  type ColumnFiltersState,
  type ExpandedState,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type PaginationState,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";
import { useLiveQuery } from "@tanstack/react-db";
import { ChevronsDownUp, ChevronsUpDown, Download, Plus, Search, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { taxonCollection } from "./collection";
import { buildTree, CATEGORIES, NIVEAUX, type TaxonNode } from "./data";
import type { DeleteTarget } from "./delete-alert-dialog";
import { DeleteAlertDialog } from "./delete-alert-dialog";
import { getTaxonsColumns } from "./taxons-columns";
import { TaxonsTable } from "./taxons-table";

const ALL = "Tous";

export function Taxons() {
  const { data: rows } = useLiveQuery(taxonCollection);
  const data = React.useMemo(() => buildTree(rows ?? []), [rows]);
  const [deleteTarget, setDeleteTarget] = React.useState<DeleteTarget | null>(null);

  const [sorting, setSorting] = React.useState<SortingState>([{ id: "nom", desc: false }]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility] = React.useState<VisibilityState>({ search: false });
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });
  const [expanded, setExpanded] = React.useState<ExpandedState>({});

  const columns = React.useMemo(
    () => getTaxonsColumns(setDeleteTarget),
    [],
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters, columnVisibility, pagination, expanded },
    getSubRows: (row) => row.children,
    filterFromLeafRows: true,
    autoResetPageIndex: false,
    autoResetExpanded: false,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    onExpandedChange: setExpanded,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
  });

  const searchQuery =
    (table.getColumn("search")?.getFilterValue() as string) ?? "";
  const categorieFilter =
    (table.getColumn("categorie")?.getFilterValue() as string) ?? ALL;
  const niveauFilter =
    (table.getColumn("niveau")?.getFilterValue() as string) ?? ALL;

  function onSearch(value: string) {
    table.getColumn("search")?.setFilterValue(value || undefined);
    table.setPageIndex(0);
    if (value) setExpanded(true);
  }

  function onCategorieFilter(value: string) {
    table.getColumn("categorie")?.setFilterValue(value === ALL ? undefined : value);
    table.setPageIndex(0);
    if (value !== ALL) setExpanded(true);
  }

  function onNiveauFilter(value: string) {
    table.getColumn("niveau")?.setFilterValue(value === ALL ? undefined : value);
    table.setPageIndex(0);
    if (value !== ALL) setExpanded(true);
  }

  function handleDelete(id: string) {
    const toDelete = [id];
    for (let i = 0; i < toDelete.length; i++) {
      for (const row of rows ?? []) {
        if (row.parentId === toDelete[i]) toDelete.push(row.id);
      }
    }
    taxonCollection.delete(toDelete);
  }

  const totalTaxons = rows?.length ?? 0;
  const filteredCount = table.getFilteredRowModel().flatRows.length;

  return (
    <>
      <Card>
        <CardHeader className="border-b has-data-[slot=card-action]:grid-cols-1 md:has-data-[slot=card-action]:grid-cols-[1fr_auto]">
          <CardTitle className="text-xl leading-none">Catalogue des espèces végétales</CardTitle>
          <CardDescription className="max-w-sm leading-snug">
            {totalTaxons} taxons · hiérarchie Genre → Espèce → Variété/Cultivar
          </CardDescription>
          <CardAction className="col-start-1 row-start-auto flex w-full flex-wrap justify-start gap-2 md:col-start-2 md:row-span-2 md:row-start-1 md:w-auto md:flex-nowrap md:justify-end md:justify-self-end">
            <InputGroup className="h-7 w-full md:w-64">
              <InputGroupAddon align="inline-start">
                <Search className="size-3.5" />
              </InputGroupAddon>
              <InputGroupInput
                className="h-7"
                placeholder="Rechercher un taxon…"
                value={searchQuery}
                onChange={(e) => onSearch(e.target.value)}
              />
            </InputGroup>
            <Button variant="outline" size="sm">
              <Upload />
              Importer CSV
            </Button>
            <Button variant="outline" size="sm">
              <Download />
              Exporter
            </Button>
            <Button size="sm" asChild>
              <Link href="/admin/especes-vegetales/nouveau">
                <Plus />
                Ajouter
              </Link>
            </Button>
          </CardAction>
        </CardHeader>

        <CardContent className="flex flex-col gap-4 px-0">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4">
            <div className="flex flex-wrap items-center gap-3">
              <Select value={categorieFilter} onValueChange={onCategorieFilter}>
                <SelectTrigger size="sm">
                  <span className="text-muted-foreground">Catégorie :</span>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" align="start">
                  <SelectGroup>
                    <SelectItem value={ALL}>Toutes</SelectItem>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>

              <Select value={niveauFilter} onValueChange={onNiveauFilter}>
                <SelectTrigger size="sm">
                  <span className="text-muted-foreground">Niveau :</span>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" align="start">
                  <SelectGroup>
                    <SelectItem value={ALL}>Tous</SelectItem>
                    {NIVEAUX.map((n) => (
                      <SelectItem key={n} value={n}>{n}</SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              {(searchQuery || categorieFilter !== ALL || niveauFilter !== ALL) && (
                <span className="text-muted-foreground text-xs tabular-nums">
                  {filteredCount} résultat{filteredCount > 1 ? "s" : ""}
                </span>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-xs text-muted-foreground"
                onClick={() => setExpanded(true)}
              >
                <ChevronsUpDown className="size-3.5" />
                Développer tout
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-xs text-muted-foreground"
                onClick={() => setExpanded({})}
              >
                <ChevronsDownUp className="size-3.5" />
                Réduire tout
              </Button>
            </div>
          </div>

          <TaxonsTable table={table} />
        </CardContent>
      </Card>

      <DeleteAlertDialog
        target={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </>
  );
}
