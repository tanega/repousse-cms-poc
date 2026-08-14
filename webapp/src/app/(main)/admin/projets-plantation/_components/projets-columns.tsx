"use client";
"use no memo";

import Link from "next/link";

import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MapPin, MoreHorizontal } from "lucide-react";

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
  MANAGEMENT_TYPE_LABELS,
  type Project,
  PUBLICATION_STATUS_COLORS,
  PUBLICATION_STATUS_LABELS,
  PUBLICATION_STATUS_TRANSITIONS,
} from "@/types/project";

import type { DeleteTarget } from "./delete-alert-dialog";

export function getProjetsColumns(
  onDelete: (target: DeleteTarget) => void,
  onStatutChange: (id: string, statut: Project["publication_status"]) => void,
): ColumnDef<Project>[] {
  return [
    {
      id: "search",
      accessorFn: (row) => row.name.toLowerCase(),
      filterFn: "includesString",
      enableHiding: true,
    },
    {
      id: "name",
      accessorKey: "name",
      header: ({ column }) => (
        <button
          type="button"
          className="flex items-center gap-1 text-muted-foreground text-xs font-medium uppercase tracking-wide hover:text-foreground"
          onClick={() => column.toggleSorting()}
        >
          Projet
          <ArrowUpDown className="size-3.5" />
        </button>
      ),
      cell: ({ row }) => {
        const projet = row.original;
        return (
          <div className="min-w-0">
            <Link
              href={`/admin/projets-plantation/${encodeURIComponent(projet.id)}`}
              className="truncate font-medium text-foreground text-sm hover:underline"
            >
              {projet.name}
            </Link>
            <div className="flex items-center gap-1 text-muted-foreground text-xs">
              <MapPin className="size-3" />
              {projet.address}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "management_type",
      header: "Gestion",
      cell: ({ row }) => (
        <span className="text-muted-foreground text-xs">{MANAGEMENT_TYPE_LABELS[row.original.management_type]}</span>
      ),
    },
    {
      accessorKey: "publication_status",
      header: "Statut",
      filterFn: "equalsString",
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={cn(
            "border-0 px-2 py-0.5 text-xs font-normal",
            PUBLICATION_STATUS_COLORS[row.original.publication_status],
          )}
        >
          {PUBLICATION_STATUS_LABELS[row.original.publication_status]}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      enableHiding: false,
      enableSorting: false,
      cell: ({ row }) => {
        const projet = row.original;
        const transitions = PUBLICATION_STATUS_TRANSITIONS[projet.publication_status];
        return (
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  aria-label={`Actions pour ${projet.name}`}
                  className="size-8 rounded-md text-muted-foreground hover:bg-muted/50"
                  size="icon-sm"
                  variant="ghost"
                >
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/admin/projets-plantation/${encodeURIComponent(projet.id)}`}>Voir</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/admin/projets-plantation/${encodeURIComponent(projet.id)}/modifier`}>Modifier</Link>
                </DropdownMenuItem>
                {transitions.length > 0 && <DropdownMenuSeparator />}
                {transitions.map((statut) => (
                  <DropdownMenuItem key={statut} onClick={() => onStatutChange(projet.id, statut)}>
                    {statut === "public" && "Publier"}
                    {statut === "private" && "Repasser en privé"}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={() => onDelete({ projet })}>
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
