"use client";
import { CartesianGrid, Line, LineChart, XAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { arbres2025ParMois } from "./data";

const chartConfig = { plantes: { label: "Plants distribués", color: "var(--chart-2)" } } satisfies ChartConfig;

export function Arbres2025() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Arbres plantés en 2025</CardTitle>
        <CardDescription>Suivi mois par mois pour l'année en cours</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-64 w-full">
          <LineChart data={arbres2025ParMois}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="mois" tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line dataKey="plantes" type="monotone" stroke="var(--color-plantes)" strokeWidth={2} dot={{ r: 4, fill: "var(--color-plantes)" }} />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
