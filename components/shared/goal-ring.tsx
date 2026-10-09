import { cn, formatCurrency } from "@/lib/utils";
import type { GoalProgress } from "@/services/goals.service";

const RING_COLORS = ["#4fae82", "#e0a04a", "#3f8cf0", "#5cc7b0", "#d98a4e", "#a78bfa"];

function formatValue(value: number, format: "currency" | "number") {
  if (format === "currency") {
    return value >= 10_000
      ? `€${new Intl.NumberFormat("it-IT", { notation: "compact", maximumFractionDigits: 1 }).format(value)}`
      : formatCurrency(value).replace(",00", "");
  }
  return new Intl.NumberFormat("it-IT", { maximumFractionDigits: 1 }).format(value);
}

/** Anello di avanzamento verso un obiettivo: al centro il valore, sotto quanto manca. */
export function GoalRing({ goal, index = 0, size = 96 }: { goal: GoalProgress; index?: number; size?: number }) {
  const stroke = 6;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const color = goal.reached ? "#4fae82" : RING_COLORS[index % RING_COLORS.length];

  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--border)" strokeWidth={stroke} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - goal.ratio)}
            className="transition-all"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="tabular text-base font-semibold leading-none">{formatValue(goal.current, goal.format)}</span>
          <span className="mt-1 text-[10px] text-muted-foreground">{Math.round(goal.ratio * 100)}%</span>
        </div>
      </div>
      <div className="max-w-[9rem]">
        <p className="truncate text-sm font-medium" title={goal.title}>
          {goal.title}
        </p>
        <p className={cn("text-xs", goal.reached ? "text-success" : "text-muted-foreground")}>
          {goal.reached
            ? "Obiettivo raggiunto ✓"
            : `mancano ${formatValue(goal.remaining, goal.format)}${goal.suffix ? ` ${goal.suffix}` : ""}`}
        </p>
        <p className="text-[10px] text-muted-foreground/70">
          su {formatValue(Number(goal.target), goal.format)}
          {goal.suffix ? ` ${goal.suffix}` : ""}
        </p>
      </div>
    </div>
  );
}
