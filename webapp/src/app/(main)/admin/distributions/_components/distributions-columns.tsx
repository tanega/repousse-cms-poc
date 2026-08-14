"use client";
"use no memo";

import Link from "next/link";

import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal, Users } from "lucide-react";

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
import {
  type DistributionEvent,
  EVENT_STATUS_COLORS,
  EVENT_STATUS_LABELS,
  EVENT_STATUS_TRANSITIONS,
} from "@/types/distribution";

import type { DeleteTarget } from "./delete-alert-dialog";

export function getDistributionsColumns(
  onDelete: (target: DeleteTarget) => void,
  onStatusChange: (id: string, status: DistributionEvent["status"]) => void,
): ColumnDef<DistributionEvent>[] {
  return [
    {
      id: "search",
      accessorFn: (row) => row.title.toLowerCase(),
      filterFn: "includesString",
      enableHiding: true,
    },
    {
      id: "title",
      accessorKey: "title",
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
            {event.image_url ? (
              // biome-ignore lint/performance/noImgElement: admin table thumbnail from an external/MinIO URL
              <img src={event.image_url} alt={event.title} className="size-8 shrink-0 rounded object-cover" />
            ) : (
              <span className="size-8 shrink-0 rounded bg-muted" />
            )}
            <div className="min-w-0">
              <Link
                href={`/admin/distributions/${encodeURIComponent(event.id)}`}
                className="truncate font-medium text-foreground text-sm hover:underline"
              >
                {event.title}
              </Link>
              <div className="truncate text-muted-foreground text-xs">{event.slug}</div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Statut",
      filterFn: "equalsString",
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={cn("border-0 px-2 py-0.5 text-xs font-normal", EVENT_STATUS_COLORS[row.original.status])}
        >
          {EVENT_STATUS_LABELS[row.original.status]}
        </Badge>
      ),
    },
    {
      id: "inscrits",
      header: "Inscrits",
      cell: ({ row }) => (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Users className="size-3" />
          {row.original.reservations_count}
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
        const transitions = EVENT_STATUS_TRANSITIONS[event.status];
        return (
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  aria-label={`Actions pour ${event.title}`}
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
                {transitions.map((status) => (
                  <DropdownMenuItem key={status} onClick={() => onStatusChange(event.id, status)}>
                    {status === "published" && "Publier"}
                    {status === "closed" && "Clôturer"}
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
