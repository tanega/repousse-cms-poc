"use client";
import dynamic from "next/dynamic";
import { Building2, Leaf, MapPin, Users } from "lucide-react";
import { useState } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { pointsDistribution, projetsDePlantation, statsCommunales } from "./_components/data";
import type { AttributeKey, LayerId } from "./_components/types";
import { ATTRIBUTE_CONFIG } from "./_components/types";

const CarteMap = dynamic(
  () => import("./_components/carte-map").then((m) => m.CarteMap),
  { ssr: false, loading: () => <div className="flex h-full items-center justify-center text-muted-foreground text-sm">Chargement de la carte…</div> },
);

const POINT_LAYERS: { id: LayerId; label: string; color: string }[] = [
  { id: "distributions", label: "Points de distribution", color: "#2563eb" },
  { id: "projets",       label: "Projets de plantation",  color: "#16a34a" },
  { id: "contacts",      label: "Contacts régionaux",     color: "#9333ea" },
  { id: "stats",         label: "Stats bulles",           color: "#ea580c" },
];

const COMMUNE_ATTRS: { key: AttributeKey; label: string }[] = [
  { key: "nb_plants_distribues",    label: "Plants distribués" },
  { key: "nb_adherents",            label: "Adhérents" },
  { key: "nb_points_distribution",  label: "Points de distribution" },
  { key: "nb_projets_plantation",   label: "Projets de plantation" },
];

export default function CartePage() {
  const [communesAttribute, setCommunesAttribute] = useState<AttributeKey | null>(null);
  const [layerVisibility, setLayerVisibility] = useState<Record<LayerId, boolean>>({
    distributions: true,
    projets: true,
    contacts: true,
    stats: true,
  });

  const totalPlants = pointsDistribution.reduce((s, d) => s + d.plantsDistribues, 0);
  const projetsActifs = projetsDePlantation.filter((p) => p.statut === "actif" || p.statut === "en_cours").length;
  const communes = new Set(statsCommunales.map((s) => s.commune)).size;

  function toggleLayer(id: LayerId) {
    setLayerVisibility((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  const attrCfg = communesAttribute ? ATTRIBUTE_CONFIG[communesAttribute] : null;

  return (
    <div className="@container/main flex h-[calc(100vh-4rem)] flex-col gap-4">
      <div>
        <h1 className="font-semibold text-2xl">Carte</h1>
        <p className="text-muted-foreground text-sm">
          Cartographie des distributions, projets de plantation et contacts régionaux
        </p>
      </div>

      {/* KPI strip */}
      <div className="grid shrink-0 grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="py-3"><CardContent className="flex items-center gap-2 px-3"><MapPin className="size-4 text-blue-600 shrink-0" /><div><p className="text-muted-foreground text-xs">Points de distrib.</p><p className="font-semibold text-sm">{pointsDistribution.filter((d) => d.statut === "actif").length} actifs</p></div></CardContent></Card>
        <Card className="py-3"><CardContent className="flex items-center gap-2 px-3"><Leaf className="size-4 text-green-600 shrink-0" /><div><p className="text-muted-foreground text-xs">Projets plantation</p><p className="font-semibold text-sm">{projetsActifs} en cours</p></div></CardContent></Card>
        <Card className="py-3"><CardContent className="flex items-center gap-2 px-3"><Building2 className="size-4 text-purple-600 shrink-0" /><div><p className="text-muted-foreground text-xs">Communes couvertes</p><p className="font-semibold text-sm">{communes}</p></div></CardContent></Card>
        <Card className="py-3"><CardContent className="flex items-center gap-2 px-3"><Users className="size-4 text-orange-600 shrink-0" /><div><p className="text-muted-foreground text-xs">Plants distribués</p><p className="font-semibold text-sm">{totalPlants.toLocaleString("fr-FR")}</p></div></CardContent></Card>
      </div>

      {/* Map + sidebar */}
      <div className="flex flex-1 gap-4 overflow-hidden min-h-0">
        <div className="flex-1 overflow-hidden rounded-xl border border-border">
          <CarteMap communesAttribute={communesAttribute} layerVisibility={layerVisibility} />
        </div>

        <aside className="flex w-56 shrink-0 flex-col gap-3 overflow-y-auto">

          {/* Communes choropleth control */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Communes</CardTitle>
              <CardDescription className="text-xs">Couche choroplèthe par attribut</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 pt-0">
              <Select
                value={communesAttribute ?? "none"}
                onValueChange={(v) => setCommunesAttribute(v === "none" ? null : (v as AttributeKey))}
              >
                <SelectTrigger size="sm" className="w-full text-xs">
                  <SelectValue placeholder="— Masquer —" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Masquer —</SelectItem>
                  {COMMUNE_ATTRS.map((a) => (
                    <SelectItem key={a.key} value={a.key}>{a.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Choropleth legend */}
              {attrCfg && (
                <div className="mt-1 flex flex-col gap-1">
                  <p className="text-muted-foreground text-xs font-medium">{attrCfg.label}</p>
                  <div className="flex h-3 w-full overflow-hidden rounded-sm">
                    {attrCfg.steps.map(([, color], i) => (
                      <div key={i} className="flex-1" style={{ background: color }} />
                    ))}
                  </div>
                  <div className="flex justify-between text-muted-foreground" style={{ fontSize: "10px" }}>
                    <span>{attrCfg.steps[0][0]}</span>
                    <span>≥ {attrCfg.steps[attrCfg.steps.length - 1][0]} {attrCfg.unit}</span>
                  </div>
                  <ul className="mt-1 flex flex-col gap-0.5">
                    {attrCfg.steps.map(([threshold, color], i) => (
                      <li key={i} className="flex items-center gap-1.5" style={{ fontSize: "10px" }}>
                        <span className="inline-block size-2.5 shrink-0 rounded-sm" style={{ background: color }} />
                        <span className="text-foreground">
                          {i < attrCfg.steps.length - 1
                            ? `${threshold} – ${attrCfg.steps[i + 1][0] - 1}`
                            : `≥ ${threshold}`}
                          {" "}{attrCfg.unit}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Point layers toggles */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Couches ponctuelles</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 pt-0">
              {POINT_LAYERS.map((l) => (
                <div key={l.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`layer-${l.id}`}
                    checked={layerVisibility[l.id]}
                    onCheckedChange={() => toggleLayer(l.id)}
                  />
                  <span className="inline-block size-2.5 shrink-0 rounded-full" style={{ background: l.color }} />
                  <Label htmlFor={`layer-${l.id}`} className="cursor-pointer text-xs font-normal">
                    {l.label}
                  </Label>
                </div>
              ))}
              <p className="mt-1 text-muted-foreground text-xs">Cliquer sur un point pour le détail.</p>
            </CardContent>
          </Card>

          {/* Communes ranking */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Communes</CardTitle>
              <CardDescription className="text-xs">Plants distribués</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-1.5 pt-0">
              {statsCommunales.sort((a, b) => b.plantsDistribues - a.plantsDistribues).map((s) => (
                <div key={s.commune} className="flex items-center justify-between text-xs">
                  <span className="truncate text-foreground">{s.commune}</span>
                  <span className="ml-2 shrink-0 font-medium text-muted-foreground">{s.plantsDistribues.toLocaleString("fr-FR")}</span>
                </div>
              ))}
            </CardContent>
          </Card>

        </aside>
      </div>
    </div>
  );
}
