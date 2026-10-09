"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { formatCurrency } from "@/lib/utils";
import { useChartColors } from "./use-chart-colors";

type Point = { label: string; profitto: number };

export function ProfitChart({ data }: { data: Point[] }) {
  const { colors: CHART_COLORS, tooltipStyle: TOOLTIP_STYLE } = useChartColors();
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
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
        <Line
          type="monotone"
          dataKey="profitto"
          name="Profitto"
          stroke={CHART_COLORS.primary}
          strokeWidth={2}
          dot={{ r: 3 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
