"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { formatCurrency } from "@/lib/utils";
import { useChartColors } from "./use-chart-colors";

type Point = { label: string; entrate: number; uscite: number };

export function IncomeExpenseChart({ data }: { data: Point[] }) {
  const { colors: CHART_COLORS, tooltipStyle: TOOLTIP_STYLE } = useChartColors();
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke={CHART_COLORS.grid} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
        <YAxis
          tickLine={false}
          axisLine={false}
          fontSize={12}
          tickFormatter={(v: number) => new Intl.NumberFormat("it-IT", { notation: "compact" }).format(v)}
        />
        <Tooltip
          formatter={(value) => formatCurrency(Number(value))}
          contentStyle={TOOLTIP_STYLE}
        />
        <Legend wrapperStyle={{ fontSize: 13 }} />
        <Bar dataKey="entrate" name="Entrate" fill={CHART_COLORS.success} radius={[4, 4, 0, 0]} />
        <Bar dataKey="uscite" name="Uscite" fill={CHART_COLORS.destructive} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
