"use client";

import Link from "next/link";

import { Mail, MapPinOff, Phone } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatPhone } from "@/lib/phone";
import type { AdminNursery } from "@/types/nursery";

import { ownerName } from "./data";

export interface NurseryRow {
  nursery: AdminNursery;
  /** Plants within the active filters. */
  quantity: number;
  /** Per-taxon breakdown within the filters, largest first. */
  lines: { name: string; quantity: number }[];
}

export function NurseriesTable({
  rows,
  focusedId,
  onFocus,
}: {
  rows: NurseryRow[];
  focusedId: string | null;
  onFocus: (nurseryId: string | null) => void;
}) {
  return (
    <Table className="**:data-[slot='table-cell']:px-4 **:data-[slot='table-head']:px-4">
      <TableHeader className="[&_tr]:border-t">
        <TableRow>
          {["Famille d'accueil", "Nurserie", "Contact"].map((label) => (
            <TableHead key={label} className="py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">
              {label}
            </TableHead>
          ))}
          <TableHead className="py-3 text-right font-medium text-muted-foreground text-xs uppercase tracking-wide">
            Plants
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length ? (
          rows.map(({ nursery, quantity, lines }) => {
            const { owner } = nursery;
            const locatedOnMap = nursery.lat != null && nursery.lng != null;
            const focused = nursery.id === focusedId;
            return (
              <TableRow
                key={nursery.id}
                data-testid="nursery-row"
                data-state={focused ? "selected" : undefined}
                className="cursor-pointer border-border/60 align-top"
                onClick={() => onFocus(focused ? null : nursery.id)}
              >
                <TableCell className="py-2.5">
                  {owner ? (
                    <Link
                      href={`/membres/${owner.id}`}
                      className="font-medium text-sm hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {ownerName(owner)}
                    </Link>
                  ) : (
                    <span className="text-muted-foreground text-sm">{ownerName(owner)}</span>
                  )}
                </TableCell>
                <TableCell className="py-2.5">
                  <div className="font-medium text-sm">{nursery.name}</div>
                  <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                    {nursery.address ?? "Adresse non renseignée"}
                    {!locatedOnMap && (
                      <Badge variant="outline" className="gap-1 px-1.5 py-0 font-normal text-[11px]">
                        <MapPinOff className="size-3" />
                        non localisée
                      </Badge>
                    )}
                  </div>
                  {lines.length > 0 && (
                    <div className="mt-1 text-muted-foreground text-xs">
                      {lines
                        .slice(0, 3)
                        .map((l) => `${l.name} (${l.quantity})`)
                        .join(", ")}
                      {lines.length > 3 && `, +${lines.length - 3}`}
                    </div>
                  )}
                </TableCell>
                <TableCell className="py-2.5 text-xs">
                  {owner?.email && (
                    <a
                      href={`mailto:${owner.email}`}
                      className="flex items-center gap-1.5 hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Mail className="size-3.5 text-muted-foreground" />
                      {owner.email}
                    </a>
                  )}
                  {owner?.phone ? (
                    <a
                      href={`tel:${owner.phone}`}
                      className="mt-1 flex items-center gap-1.5 tabular-nums hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Phone className="size-3.5 text-muted-foreground" />
                      {formatPhone(owner.phone)}
                    </a>
                  ) : (
                    <span className="mt-1 flex items-center gap-1.5 text-muted-foreground">
                      <Phone className="size-3.5" />
                      non renseigné
                    </span>
                  )}
                </TableCell>
                <TableCell className="py-2.5 text-right font-medium tabular-nums">
                  {quantity.toLocaleString("fr-FR")}
                </TableCell>
              </TableRow>
            );
          })
        ) : (
          <TableRow>
            <TableCell colSpan={4} className="h-24 text-center text-muted-foreground text-sm">
              Aucune nurserie pour ces critères.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
