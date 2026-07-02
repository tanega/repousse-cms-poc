import Link from "next/link";

import { ArrowLeft, Edit, ExternalLink, GitBranch, Leaf, Package, TreePine } from "lucide-react";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

import {
  CATEGORIE_COLORS,
  findAncestors,
  findTaxonById,
  NIVEAU_COLORS,
  type Taxon,
} from "../_components/data";

function TaxonCard({ taxon }: { taxon: Taxon }) {
  return (
    <Link
      href={`/admin/especes-vegetales/${encodeURIComponent(taxon.id)}`}
      className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/20 p-3 transition-colors hover:bg-muted/40"
    >
      {taxon.imageUrl ? (
        <img src={taxon.imageUrl} alt={taxon.nomCommun} className="size-10 shrink-0 rounded object-cover" />
      ) : (
        <span className="flex size-10 shrink-0 items-center justify-center rounded bg-muted">
          <Leaf className="size-4 text-muted-foreground" />
        </span>
      )}
      <div className="min-w-0">
        <p className="truncate font-medium text-sm">{taxon.nomCommun}</p>
        {taxon.nomScientifique && (
          <p className="truncate italic text-muted-foreground text-xs">{taxon.nomScientifique}</p>
        )}
      </div>
      <Badge
        variant="outline"
        className={cn("ml-auto shrink-0 border-0 px-2 py-0.5 text-xs font-normal", NIVEAU_COLORS[taxon.niveau])}
      >
        {taxon.niveau}
      </Badge>
    </Link>
  );
}

export default async function TaxonDetailPage({
  params,
}: {
  params: Promise<{ especeId: string }>;
}) {
  const { especeId } = await params;
  const id = decodeURIComponent(especeId);
  const taxon = findTaxonById(id);

  if (!taxon) notFound();

  const ancestors = findAncestors(id) ?? [];
  const hasImage = !!taxon.imageUrl;
  const totalUtilisations = taxon.nbDistributions + taxon.nbProjets;

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
                {a.nomCommun}
              </Link>
            </span>
          ))}
          <span>/</span>
          <span className="font-medium text-foreground">{taxon.nomCommun}</span>
        </nav>
      </div>

      {/* Hero */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
        {hasImage ? (
          <img
            src={taxon.imageUrl}
            alt={taxon.nomCommun}
            className="w-full rounded-xl object-cover sm:size-48 sm:w-48 sm:shrink-0"
            style={{ aspectRatio: "4/3" }}
          />
        ) : (
          <div className="flex w-full items-center justify-center rounded-xl bg-muted sm:size-48 sm:w-48 sm:shrink-0" style={{ aspectRatio: "4/3" }}>
            <Leaf className="size-12 text-muted-foreground/40" />
          </div>
        )}
        <div className="flex flex-1 flex-col gap-3">
          <div>
            <h1 className="font-semibold text-2xl leading-tight">{taxon.nomCommun}</h1>
            {taxon.nomScientifique && (
              <p className="mt-0.5 italic text-muted-foreground text-lg">{taxon.nomScientifique}</p>
            )}
            {taxon.nonTaxonomique && (
              <Badge variant="outline" className="mt-1 border-dashed text-xs font-normal text-muted-foreground">
                Entrée non-taxonomique
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge
              variant="outline"
              className={cn("border-0 px-2.5 py-1 text-xs font-medium", NIVEAU_COLORS[taxon.niveau])}
            >
              {taxon.niveau}
            </Badge>
            <Badge
              variant="outline"
              className={cn("border-0 px-2.5 py-1 text-xs font-medium", CATEGORIE_COLORS[taxon.categorie])}
            >
              {taxon.categorie}
            </Badge>
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
                    {a.nomScientifique ?? a.nomCommun}
                  </Link>
                </span>
              ))}
              <span className="text-muted-foreground/40">→</span>
              <span className="font-medium text-foreground">
                {taxon.nomScientifique ?? taxon.nomCommun}
              </span>
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
          {(taxon.children?.length ?? 0) > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Taxons enfants
                  <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground">
                    {taxon.children!.length}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {taxon.children!.map((child) => (
                  <TaxonCard key={child.id} taxon={child} />
                ))}
              </CardContent>
            </Card>
          )}

          {/* Liens */}
          {taxon.liens.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Bases de connaissance</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {taxon.liens.map((lien, i) => (
                  <a
                    key={i}
                    href={lien.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 rounded-lg border border-border/60 px-3 py-2.5 text-sm transition-colors hover:bg-muted/40"
                  >
                    <ExternalLink className="size-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{lien.source}</p>
                      <p className="truncate text-muted-foreground text-xs">{lien.url}</p>
                    </div>
                  </a>
                ))}
              </CardContent>
            </Card>
          )}

          {taxon.liens.length === 0 && (taxon.children?.length ?? 0) === 0 && (
            <p className="text-muted-foreground text-sm">
              Aucun taxon enfant ni lien externe pour ce taxon.
            </p>
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
                <span className={cn("font-semibold tabular-nums", taxon.nbDistributions > 0 ? "text-foreground" : "text-muted-foreground")}>
                  {taxon.nbDistributions > 0 ? taxon.nbDistributions : "—"}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <TreePine className="size-4" />
                  Projets plantation
                </div>
                <span className={cn("font-semibold tabular-nums", taxon.nbProjets > 0 ? "text-foreground" : "text-muted-foreground")}>
                  {taxon.nbProjets > 0 ? taxon.nbProjets : "—"}
                </span>
              </div>
              {totalUtilisations > 0 && (
                <>
                  <Separator />
                  <p className="text-muted-foreground text-xs">
                    Ce taxon est protégé contre la suppression car il est référencé dans {totalUtilisations} ressource{totalUtilisations > 1 ? "s" : ""}.
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Image URL en lecture */}
          {taxon.imageUrl && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Image</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <a
                  href={taxon.imageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 break-all text-xs text-muted-foreground hover:text-foreground hover:underline"
                >
                  <ExternalLink className="size-3 shrink-0" />
                  {taxon.imageUrl}
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
            {taxon.niveau !== "Variété/Cultivar" && (
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
