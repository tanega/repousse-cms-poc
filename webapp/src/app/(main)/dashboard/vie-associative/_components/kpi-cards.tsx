import { CalendarDays, Leaf, MapPin, TreePine, TrendingDown, TrendingUp, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { kpiMetrics } from "./data";

function KpiCard({ icon: Icon, label, value, delta, subtitle }: { icon: React.ElementType; label: string; value: string; delta: number; subtitle: string; }) {
  const positive = delta >= 0;
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <div className="flex size-7 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
            <Icon className="size-4" />
          </div>
        </CardTitle>
        <CardDescription>{label}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <div className="font-medium text-3xl tabular-nums leading-none tracking-tight">{value}</div>
          <Badge variant={positive ? "default" : "destructive"}>
            {positive ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
            {positive ? "+" : ""}{delta}
          </Badge>
        </div>
        <p className="text-muted-foreground text-sm">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

export function KpiCards() {
  return (
    <div className="grid grid-cols-1 gap-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs xl:grid-cols-4 dark:*:data-[slot=card]:bg-card">
      <KpiCard icon={Users} label="Adhérents actifs" value={kpiMetrics.totalAdherents.toLocaleString("fr-FR")} delta={kpiMetrics.totalAdherentsDelta} subtitle="vs même période l'an dernier" />
      <KpiCard icon={TreePine} label="Arbres plantés (total)" value={kpiMetrics.totalArbresPlantes.toLocaleString("fr-FR")} delta={kpiMetrics.totalArbresPlantesDelta} subtitle="plants distribués cumulés" />
      <KpiCard icon={CalendarDays} label="Distributions menées" value={kpiMetrics.totalDistributions.toLocaleString("fr-FR")} delta={kpiMetrics.totalDistributionsDelta} subtitle="depuis le début de l'association" />
      <KpiCard icon={MapPin} label="Communes couvertes" value={kpiMetrics.communesCouvertes.toLocaleString("fr-FR")} delta={kpiMetrics.communesCouvertesDelta} subtitle="zones d'impact actives" />
    </div>
  );
}

export function Co2Banner() {
  return (
    <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30">
      <CardContent className="flex flex-wrap items-center gap-6 pt-4">
        <div className="flex items-center gap-3">
          <Leaf className="size-6 text-green-600" />
          <div>
            <p className="text-muted-foreground text-xs">CO₂ évité / an (estimé)</p>
            <p className="font-bold text-green-700 text-xl dark:text-green-400">{kpiMetrics.co2EviteAnnuelTonnes} tCO₂eq</p>
          </div>
        </div>
        <div className="h-8 w-px bg-green-200 dark:bg-green-800" />
        <div>
          <p className="text-muted-foreground text-xs">CO₂ évité sur durée de vie (estimé)</p>
          <p className="font-bold text-green-700 text-xl dark:text-green-400">{kpiMetrics.co2EviteVieEntiereTonnes.toLocaleString("fr-FR")} tCO₂eq</p>
        </div>
        <p className="text-muted-foreground text-xs italic">Hypothèse : coefficients modèle Citizing — 100 % de survie des plants</p>
      </CardContent>
    </Card>
  );
}
