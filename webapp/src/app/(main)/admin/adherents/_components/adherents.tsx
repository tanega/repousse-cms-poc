"use client";
"use no memo";

import * as React from "react";

import Link from "next/link";

import { useLiveQuery } from "@tanstack/react-db";
import {
  type ColumnFiltersState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type PaginationState,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";
import { Download, Plus, Search, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { getAdherentsColumns } from "./adherents-columns";
import { AdherentsTable } from "./adherents-table";
import { adherentCollection } from "./collection";
import { filters, profileTypeLabels, statusLabels } from "./data";

export function Adherents() {
  const { data: rows } = useLiveQuery(adherentCollection);
  const adherents = React.useMemo(() => rows ?? [], [rows]);

  const handleDeactivate = React.useCallback((id: string) => {
    adherentCollection.update(id, (draft) => {
      draft.status = "suspended";
    });
  }, []);
  const adherentsColumns = React.useMemo(() => getAdherentsColumns(handleDeactivate), [handleDeactivate]);

  const [rowSelection, setRowSelection] = React.useState({});
  const [sorting, setSorting] = React.useState<SortingState>([{ id: "lastSeenAt", desc: true }]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({
    search: false,
  });
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const table = useReactTable({
    data: adherents,
    columns: adherentsColumns,
    state: { rowSelection, sorting, columnFilters, columnVisibility, pagination },
    getRowId: (row) => row.id,
    autoResetPageIndex: false,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const searchQuery = (table.getColumn("search")?.getFilterValue() as string) ?? "";
  const profileTypeFilter = (table.getColumn("profileTypes")?.getFilterValue() as string) ?? filters.profileType[0];
  const statusFilter = (table.getColumn("status")?.getFilterValue() as string) ?? filters.status[0];
  const selectedCount = table.getFilteredSelectedRowModel().rows.length;

  function setSelectFilter(columnId: string, value: string) {
    const resetValue = value === "Tous" ? undefined : value;
    table.getColumn(columnId)?.setFilterValue(resetValue);
    table.setPageIndex(0);
  }

  return (
    <Card>
      <CardHeader className="border-b has-data-[slot=card-action]:grid-cols-1 md:has-data-[slot=card-action]:grid-cols-[1fr_auto]">
        <CardTitle className="text-xl leading-none">Membres</CardTitle>
        <CardDescription className="max-w-sm leading-snug">
          Gérez les comptes membres de l'association Repousse et leur adhésion.
        </CardDescription>
        <CardAction className="col-start-1 row-start-auto flex w-full flex-wrap justify-start gap-2 justify-self-stretch md:col-start-2 md:row-span-2 md:row-start-1 md:w-auto md:flex-nowrap md:justify-end md:justify-self-end">
          <InputGroup className="h-7 w-full md:w-64">
            <InputGroupAddon align="inline-start">
              <Search className="size-3.5" />
            </InputGroupAddon>
            <InputGroupInput
              className="h-7"
              placeholder="Rechercher un membre..."
              value={searchQuery}
              onChange={(e) => {
                table.getColumn("search")?.setFilterValue(e.target.value || undefined);
                table.setPageIndex(0);
              }}
            />
          </InputGroup>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/automatisations">
              <Zap />
              Automatisations
            </Link>
          </Button>
          <Button variant="outline" size="sm">
            <Download />
            Exporter
          </Button>
          <Button size="sm" asChild>
            <Link href="/admin/adherents/nouveau">
              <Plus />
              Ajouter
            </Link>
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-4 px-0">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4">
          <div className="flex flex-wrap items-center gap-3">
            <Select value={profileTypeFilter} onValueChange={(v) => setSelectFilter("profileTypes", v)}>
              <SelectTrigger size="sm">
                <span className="text-muted-foreground">Profil :</span>
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" align="start">
                <SelectGroup>
                  {filters.profileType.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt === "Tous" ? opt : profileTypeLabels[opt]}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={(v) => setSelectFilter("status", v)}>
              <SelectTrigger size="sm">
                <span className="text-muted-foreground">Statut :</span>
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" align="start">
                <SelectGroup>
                  {filters.status.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt === "Tous" ? opt : statusLabels[opt]}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="text-muted-foreground text-sm tabular-nums">
            {selectedCount > 0 ? `${selectedCount} sélectionné${selectedCount > 1 ? "s" : ""}` : null}
          </div>
        </div>

        <AdherentsTable table={table} />
      </CardContent>
    </Card>
  );
}
