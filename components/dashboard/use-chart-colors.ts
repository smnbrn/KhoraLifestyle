"use client";

import { useTheme } from "@/components/layout/theme-provider";
import { CHART_PALETTES, chartTooltipStyle } from "./chart-colors";

export function useChartColors() {
  const { theme } = useTheme();
  const colors = CHART_PALETTES[theme];
  return { colors, tooltipStyle: chartTooltipStyle(colors) };
}
