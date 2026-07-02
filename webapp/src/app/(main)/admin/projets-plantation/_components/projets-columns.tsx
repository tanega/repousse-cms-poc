"use client";
"use no memo";

import Link from "next/link";

import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MapPin, MoreHorizontal, Users } from "lucide-react";

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

import { type ProjetPlantation, STATUT_COLORS, STATUT_TRANSITIONS } from "./data";
import type { DeleteTarget } from "./delete-alert-dialog";

export function getProjetsColumns(
  onDelete: (target: DeleteTarget) => void,
  onStatutChange: (id: string, statut: ProjetPlantation["statut"]) => void,
): ColumnDef<ProjetPlantation>[] {
  return [
    {
      id: "search",
      accessorFn: (row) => row.nom.toLowerCase(),
      filterFn: "includesString",
      enableHiding: true,
    },
    {
      id: "nom",
      accessorKey: "nom",
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
              {projet.nom}
            </Link>
            <div className="flex items-center gap-1 text-muted-foreground text-xs">
              <MapPin className="size-3" />
              {projet.adresse}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "natureGestion",
      header: "Gestion",
      cell: ({ row }) => <span className="text-muted-foreground text-xs">{row.original.natureGestion}</span>,
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
      id: "membres",
      header: "Membres",
      cell: ({ row }) => (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Users className="size-3" />
          {row.original.nbMembres}
        </div>
      ),
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      enableHiding: false,
      enableSorting: false,
      cell: ({ row }) => {
        const projet = row.original;
        const transitions = STATUT_TRANSITIONS[projet.statut];
        return (
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  aria-label={`Actions pour ${projet.nom}`}
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
                    {statut === "Public" && "Publier"}
                    {statut === "Privé" && "Repasser en privé"}
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
