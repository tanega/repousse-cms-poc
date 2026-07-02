"use client";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { adherentsParAnnee } from "./data";

const chartConfig = { adherents: { label: "Adhérents", color: "var(--chart-1)" } } satisfies ChartConfig;

export function AdherentsParAnnee() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Adhérents par année</CardTitle>
        <CardDescription>Nombre de membres actifs année par année</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-64 w-full">
          <BarChart data={adherentsParAnnee}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="annee" tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="adherents" fill="var(--color-adherents)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
