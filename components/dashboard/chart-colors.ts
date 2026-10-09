// Colori come valori letterali (recharts non risolve sempre bene le variabili CSS).
// Una palette per tema: si sceglie con useChartColors().
export type ChartTheme = "light" | "dark";

export const CHART_PALETTES = {
  dark: {
    primary: "#3f8cf0",
    success: "#4fae82",
    warning: "#e0a04a",
    destructive: "#e0574c",
    muted: "#9b9b9b",
    grid: "#303030",
    tooltipBg: "#232323",
    tooltipBorder: "#3a3a3a",
    text: "#ececec",
  },
  light: {
    primary: "#2f6fd6",
    success: "#2f8f63",
    warning: "#b7791f",
    destructive: "#d1423a",
    muted: "#8a8a86",
    grid: "#e3e3df",
    tooltipBg: "#ffffff",
    tooltipBorder: "#dcdcd7",
    text: "#1f1f1f",
  },
} as const;

export function chartTooltipStyle(colors: (typeof CHART_PALETTES)[ChartTheme]) {
  return {
    borderRadius: 8,
    backgroundColor: colors.tooltipBg,
    border: `1px solid ${colors.tooltipBorder}`,
    color: colors.text,
    fontSize: 13,
  } as const;
}
