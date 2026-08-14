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
import { Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EVENT_STATUS_LABELS, EVENT_STATUSES } from "@/types/distribution";

import { distributionEventCollection } from "./collection";
import type { DeleteTarget } from "./delete-alert-dialog";
import { DeleteAlertDialog } from "./delete-alert-dialog";
import { getDistributionsColumns } from "./distributions-columns";
import { DistributionsTable } from "./distributions-table";

const ALL = "Tous";

export function Distributions() {
  const { data: rows } = useLiveQuery(distributionEventCollection);
  const data = React.useMemo(() => rows ?? [], [rows]);
  const [deleteTarget, setDeleteTarget] = React.useState<DeleteTarget | null>(null);

  const [sorting, setSorting] = React.useState<SortingState>([{ id: "title", desc: false }]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility] = React.useState<VisibilityState>({ search: false });
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });

  function handleDelete(id: string) {
    distributionEventCollection.delete([id]);
  }

  const handleStatusChange = React.useCallback((id: string, status: (typeof EVENT_STATUSES)[number]) => {
    distributionEventCollection.update(id, (draft) => {
      draft.status = status;
    });
  }, []);

  const columns = React.useMemo(
    () => getDistributionsColumns(setDeleteTarget, handleStatusChange),
    [handleStatusChange],
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters, columnVisibility, pagination },
    autoResetPageIndex: false,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const searchQuery = (table.getColumn("search")?.getFilterValue() as string) ?? "";
  const statusFilter = (table.getColumn("status")?.getFilterValue() as string) ?? ALL;

  function onSearch(value: string) {
    table.getColumn("search")?.setFilterValue(value || undefined);
    table.setPageIndex(0);
  }

  function onStatusFilter(value: string) {
    table.getColumn("status")?.setFilterValue(value === ALL ? undefined : value);
    table.setPageIndex(0);
  }

  const totalEvents = rows?.length ?? 0;
  const filteredCount = table.getFilteredRowModel().flatRows.length;

  return (
    <>
      <Card>
        <CardHeader className="border-b has-data-[slot=card-action]:grid-cols-1 md:has-data-[slot=card-action]:grid-cols-[1fr_auto]">
          <CardTitle className="text-xl leading-none">Événements de distribution</CardTitle>
          <CardDescription className="max-w-sm leading-snug">
            {totalEvents} événement{totalEvents > 1 ? "s" : ""} · Brouillon → Publié → Clôturé
          </CardDescription>
          <CardAction className="col-start-1 row-start-auto flex w-full flex-wrap justify-start gap-2 md:col-start-2 md:row-span-2 md:row-start-1 md:w-auto md:flex-nowrap md:justify-end md:justify-self-end">
            <InputGroup className="h-7 w-full md:w-64">
              <InputGroupAddon align="inline-start">
                <Search className="size-3.5" />
              </InputGroupAddon>
              <InputGroupInput
                className="h-7"
                placeholder="Rechercher un événement…"
                value={searchQuery}
                onChange={(e) => onSearch(e.target.value)}
              />
            </InputGroup>
            <Button size="sm" asChild>
              <Link href="/admin/distributions/nouveau">
                <Plus />
                Créer un événement
              </Link>
            </Button>
          </CardAction>
        </CardHeader>

        <CardContent className="flex flex-col gap-4 px-0">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4">
            <Select value={statusFilter} onValueChange={onStatusFilter}>
              <SelectTrigger size="sm">
                <span className="text-muted-foreground">Statut :</span>
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" align="start">
                <SelectGroup>
                  <SelectItem value={ALL}>Tous</SelectItem>
                  {EVENT_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {EVENT_STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>

            {(searchQuery || statusFilter !== ALL) && (
              <span className="text-muted-foreground text-xs tabular-nums">
                {filteredCount} résultat{filteredCount > 1 ? "s" : ""}
              </span>
            )}
          </div>

          <DistributionsTable table={table} />
        </CardContent>
      </Card>

      <DeleteAlertDialog target={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} />
    </>
  );
}
