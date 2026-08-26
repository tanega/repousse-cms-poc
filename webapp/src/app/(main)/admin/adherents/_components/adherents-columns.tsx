"use client";
"use no memo";

import Link from "next/link";

import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { MoreHorizontal } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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

import {
  type AdherentRow,
  fullName,
  isAdhesionActive,
  profileTypeLabels,
  roleBadgeMeta,
  roleLabels,
  statusMeta,
} from "./data";

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

function ProfileTypeCell({ profileTypes }: { profileTypes: AdherentRow["profiles"] }) {
  if (profileTypes.length === 0) return <span className="text-muted-foreground text-xs">—</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {profileTypes.map((p) => (
        <span key={p.id} className="whitespace-nowrap text-muted-foreground text-xs font-medium">
          {profileTypeLabels[p.profile_type]}
        </span>
      ))}
    </div>
  );
}

function RoleBadge({ role }: { role: AdherentRow["role"] }) {
  if (role === "member") return null;
  return (
    <Badge className={cn("gap-1.5 border px-2 py-1 font-medium", roleBadgeMeta[role])} variant="outline">
      {roleLabels[role]}
    </Badge>
  );
}

function StatusBadge({ status }: { status: AdherentRow["status"] }) {
  const meta = statusMeta[status];
  return (
    <Badge className={cn("gap-1.5 border px-2 py-1 font-medium", meta.badgeClass)} variant="outline">
      <span className={cn("size-1.5 rounded-full", meta.dotClass)} />
      {status === "active" ? "Actif" : "Suspendu"}
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

export function getAdherentsColumns(onDeactivate: (id: string) => void): ColumnDef<AdherentRow>[] {
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
            aria-label={`Sélectionner ${fullName(row.original)}`}
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
      accessorFn: (row) => `${fullName(row)} ${row.email}`,
      filterFn: "includesString",
      enableHiding: true,
    },
    {
      id: "name",
      header: "Membre",
      cell: ({ row }) => {
        const name = fullName(row.original);
        return (
          <div className="flex items-center gap-3">
            <Avatar size="lg" className={cn("font-medium", getAvatarTone(name || row.original.email))}>
              <AvatarFallback>{getInitials(name || row.original.email)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate font-medium text-foreground text-sm">{name || "—"}</span>
                <RoleBadge role={row.original.role} />
              </div>
              <div className="truncate text-muted-foreground text-sm">{row.original.email}</div>
            </div>
          </div>
        );
      },
    },
    {
      id: "profileTypes",
      header: "Profils",
      filterFn: (row, _id, filterValue) => row.original.profiles.some((p) => p.profile_type === filterValue),
      cell: ({ row }) => <ProfileTypeCell profileTypes={row.original.profiles} />,
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
      id: "membershipYear",
      accessorFn: (row) => row.membership_year ?? 0,
      header: "Année d'adhésion",
      cell: ({ row }) => <div className="text-muted-foreground text-sm">{row.original.membership_year ?? "—"}</div>,
    },
    {
      id: "lastSeenAt",
      accessorFn: (row) => (row.last_seen_at ? new Date(row.last_seen_at).getTime() : 0),
      header: "Dernière connexion",
      cell: ({ row }) => (
        <div className="text-muted-foreground text-sm">
          {row.original.last_seen_at ? format(new Date(row.original.last_seen_at), "dd MMM yyyy") : "—"}
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
                aria-label={`Actions pour ${fullName(row.original)}`}
                className="size-8 rounded-md text-muted-foreground hover:bg-muted/50"
                size="icon-sm"
                variant="ghost"
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/admin/adherents/${row.original.id}/modifier`}>Modifier le membre</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                disabled={row.original.status === "suspended"}
                onClick={() => onDeactivate(row.original.id)}
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
