"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { useChartColors } from "./use-chart-colors";

type Slice = { status: string; label: string; count: number };

export function ProjectStatusChart({ data }: { data: Slice[] }) {
  const { colors: CHART_COLORS, tooltipStyle: TOOLTIP_STYLE } = useChartColors();
  const COLORS: Record<string, string> = {
    planned: CHART_COLORS.muted,
    in_progress: CHART_COLORS.primary,
    paused: CHART_COLORS.warning,
    completed: CHART_COLORS.success,
    cancelled: CHART_COLORS.destructive,
  };

  if (data.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">
        Nessun progetto ancora registrato
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} dataKey="count" nameKey="label" innerRadius={50} outerRadius={80} paddingAngle={2}>
          {data.map((entry) => (
            <Cell key={entry.status} fill={COLORS[entry.status] ?? CHART_COLORS.muted} />
          ))}
        </Pie>
        <Tooltip contentStyle={TOOLTIP_STYLE} />
      </PieChart>
    </ResponsiveContainer>
  );
}
