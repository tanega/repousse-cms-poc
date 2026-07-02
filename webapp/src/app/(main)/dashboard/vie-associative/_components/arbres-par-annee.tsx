"use client";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { arbresParAnnee } from "./data";

const chartConfig = { plantes: { label: "Plants", color: "var(--chart-3)" } } satisfies ChartConfig;

export function ArbresParAnnee() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Arbres plantés par année</CardTitle>
        <CardDescription>Nombre de plants distribués chaque année</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-64 w-full">
          <BarChart data={arbresParAnnee}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="annee" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(v) => v.toLocaleString("fr-FR")} />
            <ChartTooltip content={<ChartTooltipContent formatter={(v) => (v ?? 0).toLocaleString("fr-FR")} />} />
            <Bar dataKey="plantes" fill="var(--color-plantes)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
