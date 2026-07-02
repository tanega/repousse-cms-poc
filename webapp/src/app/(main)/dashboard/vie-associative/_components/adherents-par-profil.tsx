"use client";
import { Cell, Pie, PieChart } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { adherentsParProfil } from "./data";

const chartConfig = adherentsParProfil.reduce<ChartConfig>((acc, item) => {
  acc[item.profil] = { label: item.profil, color: item.couleur };
  return acc;
}, {});

export function AdherentsParProfil() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Adhérents par profil</CardTitle>
        <CardDescription>Répartition bénévole · adoptant · famille d'accueil · admin</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="mx-auto h-64 w-full max-w-xs">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent nameKey="profil" />} />
            <Pie data={adherentsParProfil} dataKey="nombre" nameKey="profil" innerRadius={50} outerRadius={90}>
              {adherentsParProfil.map((entry) => <Cell key={entry.profil} fill={entry.couleur} />)}
            </Pie>
            <ChartLegend content={<ChartLegendContent nameKey="profil" />} className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center" />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
