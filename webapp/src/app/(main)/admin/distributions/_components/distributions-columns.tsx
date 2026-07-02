"use client";
"use no memo";

import Link from "next/link";

import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, CalendarDays, MoreHorizontal, Users } from "lucide-react";

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

import { type DistributionEvent, STATUT_COLORS, STATUT_TRANSITIONS, stockTotal } from "./data";
import type { DeleteTarget } from "./delete-alert-dialog";

const dateFormatter = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" });

function formatCreneaux(event: DistributionEvent) {
  if (event.creneaux.length === 0) return "Aucun créneau";
  const dates = event.creneaux.map((c) => dateFormatter.format(new Date(c.date))).sort();
  const first = dates[0];
  const last = dates[dates.length - 1];
  const range = first === last ? first : `${first} → ${last}`;
  return `${range} · ${event.creneaux.length} créneau${event.creneaux.length > 1 ? "x" : ""}`;
}

export function getDistributionsColumns(
  onDelete: (target: DeleteTarget) => void,
  onStatutChange: (id: string, statut: DistributionEvent["statut"]) => void,
): ColumnDef<DistributionEvent>[] {
  return [
    {
      id: "search",
      accessorFn: (row) => row.intitule.toLowerCase(),
      filterFn: "includesString",
      enableHiding: true,
    },
    {
      id: "intitule",
      accessorKey: "intitule",
      header: ({ column }) => (
        <button
          type="button"
          className="flex items-center gap-1 text-muted-foreground text-xs font-medium uppercase tracking-wide hover:text-foreground"
          onClick={() => column.toggleSorting()}
        >
          Événement
          <ArrowUpDown className="size-3.5" />
        </button>
      ),
      cell: ({ row }) => {
        const event = row.original;
        return (
          <div className="flex items-center gap-2">
            {event.imageUrl ? (
              <img src={event.imageUrl} alt={event.intitule} className="size-8 shrink-0 rounded object-cover" />
            ) : (
              <span className="size-8 shrink-0 rounded bg-muted" />
            )}
            <div className="min-w-0">
              <Link
                href={`/admin/distributions/${encodeURIComponent(event.id)}`}
                className="truncate font-medium text-foreground text-sm hover:underline"
              >
                {event.intitule}
              </Link>
              <div className="flex items-center gap-1 text-muted-foreground text-xs">
                <CalendarDays className="size-3" />
                {formatCreneaux(event)}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "statut",
      header: "Statut",
      filterFn: "equalsString",
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={cn("border-0 px-2 py-0.5 text-xs font-normal", STATUT_COLORS[row.original.statut])}
        >
          {row.original.statut}
        </Badge>
      ),
    },
    {
      id: "stock",
      header: "Stock",
      cell: ({ row }) => {
        const total = stockTotal(row.original);
        if (row.original.stock.length === 0) return <span className="text-muted-foreground text-xs">—</span>;
        return (
          <span className="text-xs text-muted-foreground">
            {total === null ? "Quantité inconnue" : `${total} plants`} · {row.original.stock.length} espèce
            {row.original.stock.length > 1 ? "s" : ""}
          </span>
        );
      },
    },
    {
      id: "inscrits",
      header: "Inscrits",
      cell: ({ row }) => (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Users className="size-3" />
          {row.original.nbInscrits}
        </div>
      ),
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      enableHiding: false,
      enableSorting: false,
      cell: ({ row }) => {
        const event = row.original;
        const transitions = STATUT_TRANSITIONS[event.statut];
        return (
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  aria-label={`Actions pour ${event.intitule}`}
                  className="size-8 rounded-md text-muted-foreground hover:bg-muted/50"
                  size="icon-sm"
                  variant="ghost"
                >
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/admin/distributions/${encodeURIComponent(event.id)}`}>Voir</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/admin/distributions/${encodeURIComponent(event.id)}/modifier`}>Modifier</Link>
                </DropdownMenuItem>
                {transitions.length > 0 && <DropdownMenuSeparator />}
                {transitions.map((statut) => (
                  <DropdownMenuItem key={statut} onClick={() => onStatutChange(event.id, statut)}>
                    {statut === "Publié" && "Publier"}
                    {statut === "Brouillon" && "Repasser en brouillon"}
                    {statut === "Clôturé" && "Clôturer"}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={() => onDelete({ event })}>
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
