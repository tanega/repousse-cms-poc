"use client";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { arbresParAnnee } from "./data";

const chartConfig = {
  cumulatif: { label: "Cumulatif", color: "var(--chart-1)" },
} satisfies ChartConfig;

export function ArbresCumules() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Évolution cumulée des arbres plantés</CardTitle>
        <CardDescription>Total cumulé depuis les débuts de l'association</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-64 w-full">
          <AreaChart data={arbresParAnnee}>
            <defs>
              <linearGradient id="gradCumulatif" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-cumulatif)" stopOpacity={0.4} />
                <stop offset="95%" stopColor="var(--color-cumulatif)" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="annee" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(v) => v.toLocaleString("fr-FR")} />
            <ChartTooltip content={<ChartTooltipContent formatter={(v) => (v ?? 0).toLocaleString("fr-FR")} />} />
            <Area dataKey="cumulatif" type="monotone" fill="url(#gradCumulatif)" stroke="var(--color-cumulatif)" strokeWidth={2} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
