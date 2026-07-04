"use client";
"use no memo";

import Link from "next/link";

import type { ColumnDef } from "@tanstack/react-table";
import { parse } from "date-fns";
import { Check, Clock, MoreHorizontal, TreePine, X } from "lucide-react";

import { Avatar, AvatarBadge, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, getInitials } from "@/lib/utils";

import { type AdherentRow, isAdhesionActive, profileTypeMeta, statusMeta } from "./data";

function getAvatarTone(name: string) {
  const tones = [
    "[&_[data-slot=avatar-fallback]]:bg-amber-100 [&_[data-slot=avatar-fallback]]:text-amber-700 dark:[&_[data-slot=avatar-fallback]]:bg-amber-500/15 dark:[&_[data-slot=avatar-fallback]]:text-amber-300",
    "[&_[data-slot=avatar-fallback]]:bg-emerald-100 [&_[data-slot=avatar-fallback]]:text-emerald-700 dark:[&_[data-slot=avatar-fallback]]:bg-emerald-500/15 dark:[&_[data-slot=avatar-fallback]]:text-emerald-300",
    "[&_[data-slot=avatar-fallback]]:bg-violet-100 [&_[data-slot=avatar-fallback]]:text-violet-700 dark:[&_[data-slot=avatar-fallback]]:bg-violet-500/15 dark:[&_[data-slot=avatar-fallback]]:text-violet-300",
    "[&_[data-slot=avatar-fallback]]:bg-sky-100 [&_[data-slot=avatar-fallback]]:text-sky-700 dark:[&_[data-slot=avatar-fallback]]:bg-sky-500/15 dark:[&_[data-slot=avatar-fallback]]:text-sky-300",
    "[&_[data-slot=avatar-fallback]]:bg-rose-100 [&_[data-slot=avatar-fallback]]:text-rose-700 dark:[&_[data-slot=avatar-fallback]]:bg-rose-500/15 dark:[&_[data-slot=avatar-fallback]]:text-rose-300",
    "[&_[data-slot=avatar-fallback]]:bg-fuchsia-100 [&_[data-slot=avatar-fallback]]:text-fuchsia-700 dark:[&_[data-slot=avatar-fallback]]:bg-fuchsia-500/15 dark:[&_[data-slot=avatar-fallback]]:text-fuchsia-300",
    "[&_[data-slot=avatar-fallback]]:bg-orange-100 [&_[data-slot=avatar-fallback]]:text-orange-700 dark:[&_[data-slot=avatar-fallback]]:bg-orange-500/15 dark:[&_[data-slot=avatar-fallback]]:text-orange-300",
    "[&_[data-slot=avatar-fallback]]:bg-indigo-100 [&_[data-slot=avatar-fallback]]:text-indigo-700 dark:[&_[data-slot=avatar-fallback]]:bg-indigo-500/15 dark:[&_[data-slot=avatar-fallback]]:text-indigo-300",
  ];
  return tones[name.length % tones.length];
}

function getLoginBadge(minutesAgo: number) {
  if (minutesAgo < 1) return { className: "bg-green-600 text-green-950 [&>svg]:text-white", icon: Check };
  if (minutesAgo < 4 * 60) return { className: "bg-amber-500 text-amber-950", icon: Clock };
  if (minutesAgo < 7 * 24 * 60) return { className: "bg-destructive", icon: null };
  return { className: "bg-muted-foreground text-muted", icon: X };
}

function formatLastLogin(minutesAgo: number): string {
  if (minutesAgo < 1) return "À l'instant";
  if (minutesAgo < 60) return `Il y a ${Math.round(minutesAgo)} min`;
  if (minutesAgo < 24 * 60) return `Il y a ${Math.round(minutesAgo / 60)} h`;
  if (minutesAgo < 30 * 24 * 60) return `Il y a ${Math.round(minutesAgo / (24 * 60))} j`;
  return `Il y a ${Math.round(minutesAgo / (30 * 24 * 60))} mois`;
}

function AvatarCell({ lastLoginAt, name }: { lastLoginAt: number; name: string }) {
  const badge = getLoginBadge(lastLoginAt);
  const BadgeIcon = badge.icon;
  return (
    <Avatar size="lg" className={cn("font-medium", getAvatarTone(name))}>
      <AvatarFallback>{getInitials(name)}</AvatarFallback>
      <AvatarBadge className={badge.className}>{BadgeIcon ? <BadgeIcon /> : null}</AvatarBadge>
    </Avatar>
  );
}

function ProfileTypeCell({
  profileTypes,
  source,
}: {
  profileTypes: AdherentRow["profileTypes"];
  source: AdherentRow["source"];
}) {
  return (
    <div className="grid gap-1">
      <div className="flex flex-wrap gap-1">
        {profileTypes.map((pt) => {
          const meta = profileTypeMeta[pt];
          const Icon = meta.icon;
          return (
            <span
              key={pt}
              className={cn("flex items-center gap-1 whitespace-nowrap text-xs font-medium", meta.className)}
            >
              <Icon className="size-3" />
              {pt}
            </span>
          );
        })}
      </div>
      <span className="text-muted-foreground text-xs">{source}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: AdherentRow["status"] }) {
  const meta = statusMeta[status];
  return (
    <Badge className={cn("gap-1.5 border px-2 py-1 font-medium", meta.badgeClass)} variant="outline">
      <span className={cn("size-1.5 rounded-full", meta.dotClass)} />
      {status}
    </Badge>
  );
}

function AdhesionBadge({ row }: { row: AdherentRow }) {
  const active = isAdhesionActive(row);
  return (
    <Badge
      className={cn(
        "gap-1.5 border px-2 py-1 font-medium",
        active
          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          : "border-border bg-muted/50 text-muted-foreground",
      )}
      variant="outline"
    >
      <span className={cn("size-1.5 rounded-full", active ? "bg-emerald-500" : "bg-muted-foreground")} />
      {active ? "Adhésion active" : "Adhésion inactive"}
    </Badge>
  );
}

export function getAdherentsColumns(onDeactivate: (email: string) => void): ColumnDef<AdherentRow>[] {
  return [
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          aria-label="Tout sélectionner"
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          aria-label={`Sélectionner ${row.original.name}`}
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
        />
      </div>
    ),
    enableHiding: false,
    enableSorting: false,
  },
  {
    id: "search",
    accessorFn: (row) => `${row.name} ${row.email}`,
    filterFn: "includesString",
    enableHiding: true,
  },
  {
    accessorKey: "name",
    header: "Membre",
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <AvatarCell name={row.original.name} lastLoginAt={row.original.lastLoginAt} />
        <div className="min-w-0">
          <div className="truncate font-medium text-foreground text-sm">{row.original.name}</div>
          <div className="truncate text-muted-foreground text-sm">{row.original.email}</div>
        </div>
      </div>
    ),
  },
  {
    accessorKey: "profileTypes",
    header: "Profils / Source",
    filterFn: "arrIncludes",
    cell: ({ row }) => <ProfileTypeCell profileTypes={row.original.profileTypes} source={row.original.source} />,
  },
  {
    accessorKey: "source",
    header: "Source",
    filterFn: "equalsString",
    cell: ({ row }) => <div className="text-sm">{row.original.source}</div>,
  },
  {
    accessorKey: "status",
    header: "Statut du compte",
    filterFn: "equalsString",
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    id: "adhesionActive",
    header: "Adhésion",
    cell: ({ row }) => <AdhesionBadge row={row.original} />,
  },
  {
    id: "memberSince",
    accessorFn: (row) => parse(row.memberSince, "dd MMM yyyy, h:mm a", new Date()).getTime(),
    header: "Adhésion",
    cell: ({ row }) => <div className="whitespace-nowrap text-foreground text-sm">{row.original.memberSince}</div>,
  },
  {
    id: "lastLoginAt",
    accessorFn: (row) => row.lastLoginAt,
    header: "Dernière connexion",
    cell: ({ row }) => <div className="text-muted-foreground text-sm">{formatLastLogin(row.original.lastLoginAt)}</div>,
  },
  {
    accessorKey: "loginCount",
    header: "Connexions",
    cell: ({ row }) => <div className="font-medium text-sm tabular-nums">{row.original.loginCount}</div>,
  },
  {
    accessorKey: "projectCount",
    header: "Projets",
    cell: ({ row }) => (
      <div className="flex items-center gap-1.5 text-sm">
        <TreePine className="size-3.5 text-primary" />
        {row.original.projectCount}
      </div>
    ),
  },
  {
    id: "actions",
    header: () => <div className="text-right">Actions</div>,
    cell: ({ row }) => (
      <div className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              aria-label={`Actions pour ${row.original.name}`}
              className="size-8 rounded-md text-muted-foreground hover:bg-muted/50"
              size="icon-sm"
              variant="ghost"
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href="/membres/me">Voir le profil</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/admin/adherents/${encodeURIComponent(row.original.email)}/modifier`}>
                Modifier le membre
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>Renouveler l'adhésion</DropdownMenuItem>
            <DropdownMenuItem>Envoyer un email</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              disabled={row.original.status === "Suspendu"}
              onClick={() => onDeactivate(row.original.email)}
            >
              Désactiver le compte
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    ),
    enableHiding: false,
    enableSorting: false,
  },
  ];
}
