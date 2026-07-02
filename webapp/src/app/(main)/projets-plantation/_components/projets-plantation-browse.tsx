"use client";

import * as React from "react";

import Link from "next/link";

import { useLiveQuery } from "@tanstack/react-db";
import { Layers, MapPin, Search, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { taxons } from "../../admin/especes-vegetales/_components/data";
import { projetPlantationCollection } from "../../admin/projets-plantation/_components/collection";
import { NATURES_GESTION, type NatureGestion } from "../../admin/projets-plantation/_components/data";

const ALL = "Toutes";

export function ProjetsPlantationBrowse() {
  const { data: rows } = useLiveQuery(projetPlantationCollection);
  const publics = React.useMemo(() => (rows ?? []).filter((p) => p.statut === "Public"), [rows]);

  const [search, setSearch] = React.useState("");
  const [nature, setNature] = React.useState<string>(ALL);

  const filtered = publics.filter((p) => {
    if (nature !== ALL && p.natureGestion !== nature) return false;
    if (search && !p.nom.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  function taxonName(id: string) {
    return taxons.find((t) => t.id === id)?.nomCommun ?? id;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <InputGroup className="h-8 w-full sm:w-72">
          <InputGroupAddon align="inline-start">
            <Search className="size-3.5" />
          </InputGroupAddon>
          <InputGroupInput
            className="h-8"
            placeholder="Rechercher un projet…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </InputGroup>
        <Select value={nature} onValueChange={setNature}>
          <SelectTrigger size="sm">
            <span className="text-muted-foreground">Gestion :</span>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value={ALL}>Toutes</SelectItem>
              {NATURES_GESTION.map((n: NatureGestion) => (
                <SelectItem key={n} value={n}>
                  {n}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <span className="text-muted-foreground text-xs tabular-nums">
          {filtered.length} projet{filtered.length > 1 ? "s" : ""} public{filtered.length > 1 ? "s" : ""}
        </span>
      </div>

      {filtered.length === 0 ? (
        <p className="text-muted-foreground text-sm">Aucun projet public ne correspond à ces critères.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((projet) => (
            <Link key={projet.id} href={`/projets-plantation/${encodeURIComponent(projet.id)}`}>
              <Card className="h-full transition-colors hover:border-foreground/20">
                <CardHeader>
                  <CardTitle className="text-base">{projet.nom}</CardTitle>
                  <CardDescription className="flex items-center gap-1 text-xs">
                    <MapPin className="size-3 shrink-0" />
                    <span className="truncate">{projet.adresse || "Adresse non renseignée"}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="line-clamp-2 text-muted-foreground text-sm">{projet.description}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {projet.especeIds.slice(0, 3).map((id) => (
                      <Badge key={id} variant="secondary" className="font-normal text-xs">
                        {taxonName(id)}
                      </Badge>
                    ))}
                    {projet.especeIds.length > 3 && (
                      <Badge variant="outline" className="font-normal text-xs">
                        +{projet.especeIds.length - 3}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground text-xs">
                    <span className="flex items-center gap-1">
                      <Layers className="size-3" />
                      {projet.natureGestion}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="size-3" />
                      {projet.membres.length}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
