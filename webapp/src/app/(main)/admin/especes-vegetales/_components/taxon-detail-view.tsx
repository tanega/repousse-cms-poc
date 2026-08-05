"use client";

import Link from "next/link";
import { notFound } from "next/navigation";

import { useLiveQuery } from "@tanstack/react-db";
import { ArrowLeft, Edit, ExternalLink, GitBranch, Leaf, Package, TreePine } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  categoryColorClass,
  findTaxonAncestors,
  findTaxonById,
  findTaxonChildren,
  TAXONOMIC_LEVEL_COLORS,
  TAXONOMIC_LEVEL_LABELS,
  type Taxon,
} from "@/types/taxon";

import { taxonCollection } from "./collection";

function TaxonCard({ taxon }: { taxon: Taxon }) {
  return (
    <Link
      href={`/admin/especes-vegetales/${encodeURIComponent(taxon.id)}`}
      className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/20 p-3 transition-colors hover:bg-muted/40"
    >
      {taxon.image_url ? (
        <img src={taxon.image_url} alt={taxon.common_name} className="size-10 shrink-0 rounded object-cover" />
      ) : (
        <span className="flex size-10 shrink-0 items-center justify-center rounded bg-muted">
          <Leaf className="size-4 text-muted-foreground" />
        </span>
      )}
      <div className="min-w-0">
        <p className="truncate font-medium text-sm">{taxon.common_name}</p>
        {taxon.scientific_name && (
          <p className="truncate italic text-muted-foreground text-xs">{taxon.scientific_name}</p>
        )}
      </div>
      <Badge
        variant="outline"
        className={cn(
          "ml-auto shrink-0 border-0 px-2 py-0.5 text-xs font-normal",
          TAXONOMIC_LEVEL_COLORS[taxon.taxonomic_level],
        )}
      >
        {TAXONOMIC_LEVEL_LABELS[taxon.taxonomic_level]}
      </Badge>
    </Link>
  );
}

export function TaxonDetailView({ id }: { id: string }) {
  const { data: rows, isLoading } = useLiveQuery(taxonCollection);

  if (isLoading) return null;

  const taxon = findTaxonById(id, rows ?? []);
  if (!taxon) notFound();

  const ancestors = findTaxonAncestors(id, rows ?? []);
  const children = findTaxonChildren(id, rows ?? []);
  const hasImage = !!taxon.image_url;
  const totalUtilisations = taxon.nb_distributions + taxon.nb_projets;

  return (
    <div className="flex flex-col gap-6">
      {/* Nav */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button variant="ghost" size="icon-sm" asChild>
          <Link href="/admin/especes-vegetales">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link href="/admin/especes-vegetales" className="hover:text-foreground transition-colors">
            Espèces végétales
          </Link>
          {ancestors.map((a) => (
            <span key={a.id} className="flex items-center gap-1.5">
              <span>/</span>
              <Link
                href={`/admin/especes-vegetales/${encodeURIComponent(a.id)}`}
                className="hover:text-foreground transition-colors"
              >
                {a.common_name}
              </Link>
            </span>
          ))}
          <span>/</span>
          <span className="font-medium text-foreground">{taxon.common_name}</span>
        </nav>
      </div>

      {/* Hero */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
        {hasImage ? (
          <img
            src={taxon.image_url ?? undefined}
            alt={taxon.common_name}
            className="w-full rounded-xl object-cover sm:size-48 sm:w-48 sm:shrink-0"
            style={{ aspectRatio: "4/3" }}
          />
        ) : (
          <div
            className="flex w-full items-center justify-center rounded-xl bg-muted sm:size-48 sm:w-48 sm:shrink-0"
            style={{ aspectRatio: "4/3" }}
          >
            <Leaf className="size-12 text-muted-foreground/40" />
          </div>
        )}
        <div className="flex flex-1 flex-col gap-3">
          <div>
            <h1 className="font-semibold text-2xl leading-tight">{taxon.common_name}</h1>
            {taxon.scientific_name && (
              <p className="mt-0.5 italic text-muted-foreground text-lg">{taxon.scientific_name}</p>
            )}
            {taxon.is_non_taxonomic && (
              <Badge variant="outline" className="mt-1 border-dashed text-xs font-normal text-muted-foreground">
                Entrée non-taxonomique
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge
              variant="outline"
              className={cn("border-0 px-2.5 py-1 text-xs font-medium", TAXONOMIC_LEVEL_COLORS[taxon.taxonomic_level])}
            >
              {TAXONOMIC_LEVEL_LABELS[taxon.taxonomic_level]}
            </Badge>
            {taxon.category && (
              <Badge
                variant="outline"
                className={cn("border-0 px-2.5 py-1 text-xs font-medium", categoryColorClass(taxon.category.slug))}
              >
                {taxon.category.name}
              </Badge>
            )}
          </div>

          {/* Breadcrumb hiérarchique */}
          {ancestors.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <GitBranch className="size-3.5 shrink-0" />
              {ancestors.map((a, i) => (
                <span key={a.id} className="flex items-center gap-1.5">
                  {i > 0 && <span className="text-muted-foreground/40">→</span>}
                  <Link
                    href={`/admin/especes-vegetales/${encodeURIComponent(a.id)}`}
                    className="hover:text-foreground hover:underline"
                  >
                    {a.scientific_name ?? a.common_name}
                  </Link>
                </span>
              ))}
              <span className="text-muted-foreground/40">→</span>
              <span className="font-medium text-foreground">{taxon.scientific_name ?? taxon.common_name}</span>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <Button size="sm" asChild>
              <Link href={`/admin/especes-vegetales/${encodeURIComponent(id)}/modifier`}>
                <Edit className="size-4" />
                Modifier
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <Separator />

      {/* Body */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main */}
        <div className="space-y-6 lg:col-span-2">
          {/* Enfants */}
          {children.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Taxons enfants
                  <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground">
                    {children.length}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {children.map((child) => (
                  <TaxonCard key={child.id} taxon={child} />
                ))}
              </CardContent>
            </Card>
          )}

          {/* Liens */}
          {taxon.external_links.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Bases de connaissance</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {taxon.external_links.map((lien) => (
                  <a
                    key={lien.id}
                    href={lien.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 rounded-lg border border-border/60 px-3 py-2.5 text-sm transition-colors hover:bg-muted/40"
                  >
                    <ExternalLink className="size-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{lien.source_name}</p>
                      <p className="truncate text-muted-foreground text-xs">{lien.url}</p>
                    </div>
                  </a>
                ))}
              </CardContent>
            </Card>
          )}

          {taxon.external_links.length === 0 && children.length === 0 && (
            <p className="text-muted-foreground text-sm">Aucun taxon enfant ni lien externe pour ce taxon.</p>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Utilisations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Package className="size-4" />
                  Distributions
                </div>
                <span
                  className={cn(
                    "font-semibold tabular-nums",
                    taxon.nb_distributions > 0 ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {taxon.nb_distributions > 0 ? taxon.nb_distributions : "—"}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <TreePine className="size-4" />
                  Projets plantation
                </div>
                <span
                  className={cn(
                    "font-semibold tabular-nums",
                    taxon.nb_projets > 0 ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {taxon.nb_projets > 0 ? taxon.nb_projets : "—"}
                </span>
              </div>
              {totalUtilisations > 0 && (
                <>
                  <Separator />
                  <p className="text-muted-foreground text-xs">
                    Ce taxon est protégé contre la suppression car il est référencé dans {totalUtilisations} ressource
                    {totalUtilisations > 1 ? "s" : ""}.
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Image URL en lecture */}
          {taxon.image_url && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Image</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <a
                  href={taxon.image_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 break-all text-xs text-muted-foreground hover:text-foreground hover:underline"
                >
                  <ExternalLink className="size-3 shrink-0" />
                  {taxon.image_url}
                </a>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <Button className="w-full" asChild>
              <Link href={`/admin/especes-vegetales/${encodeURIComponent(id)}/modifier`}>
                <Edit className="size-4" />
                Modifier ce taxon
              </Link>
            </Button>
            {taxon.taxonomic_level !== "variety" && (
              <Button variant="outline" className="w-full" asChild>
                <Link href={`/admin/especes-vegetales/nouveau?parentId=${encodeURIComponent(id)}`}>
                  Ajouter un taxon enfant
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
