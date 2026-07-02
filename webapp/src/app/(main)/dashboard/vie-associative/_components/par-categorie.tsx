"use client";
import { Cell, Pie, PieChart } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { parCategorie } from "./data";

const chartConfig = parCategorie.reduce<ChartConfig>((acc, item) => {
  acc[item.categorie] = { label: item.categorie, color: item.couleur };
  return acc;
}, {});

export function ParCategorie() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Plants par catégorie</CardTitle>
        <CardDescription>Répartition arbres · arbustes · fruitiers · grimpantes</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="mx-auto h-64 w-full max-w-xs">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent formatter={(v) => (v ?? 0).toLocaleString("fr-FR")} nameKey="categorie" />} />
            <Pie data={parCategorie} dataKey="quantite" nameKey="categorie" innerRadius={50} outerRadius={90}>
              {parCategorie.map((entry) => <Cell key={entry.categorie} fill={entry.couleur} />)}
            </Pie>
            <ChartLegend content={<ChartLegendContent nameKey="categorie" />} className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center" />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
