"use client";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { retentionParAnnee } from "./data";

const chartConfig = {
  renouveles: { label: "Renouvelés", color: "var(--chart-1)" },
  nouveaux: { label: "Nouveaux", color: "var(--chart-2)" },
  perdus: { label: "Non-renouvelés", color: "var(--chart-5)" },
} satisfies ChartConfig;

export function Retention() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Rétention des adhérents</CardTitle>
        <CardDescription>Renouvellements, nouveaux membres et non-renouvelés par année</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-72 w-full">
          <BarChart data={retentionParAnnee}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="annee" tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="renouveles" stackId="a" fill="var(--color-renouveles)" />
            <Bar dataKey="nouveaux" stackId="a" fill="var(--color-nouveaux)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="perdus" fill="var(--color-perdus)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
