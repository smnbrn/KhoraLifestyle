import { Check, Snowflake } from "lucide-react";

import { cn, formatDate } from "@/lib/utils";
import { addDays, diffDays, todayIso } from "@/lib/dates";
import { computeTimeline } from "@/lib/timeline";

const DAY_LABEL_STEPS = [1, 2, 5, 7, 14, 30, 60, 90];

/** Una riga del Gantt. È compatibile con le righe di project_phases e con i blocchi Gantt delle pagine. */
export type GanttItem = {
  id: string;
  name: string;
  start_date: string;
  duration_days: number;
  timeline_running: boolean;
  frozen_since: string | null;
  frozen_days: number;
  completed: boolean;
  /** se valorizzato è una micro attività della macro attività con quell'id */
  parent_id?: string | null;
};

/** Macro in ordine, ciascuna seguita dalle sue micro (ordinate per data di inizio). */
function orderRows<T extends GanttItem>(items: T[]): { item: T; micro: boolean }[] {
  const ids = new Set(items.map((i) => i.id));
  const isMicro = (i: T) => !!i.parent_id && ids.has(i.parent_id);
  const out: { item: T; micro: boolean }[] = [];
  for (const macro of items.filter((i) => !isMicro(i))) {
    out.push({ item: macro, micro: false });
    items
      .filter((i) => i.parent_id === macro.id)
      .sort((a, b) => a.start_date.localeCompare(b.start_date))
      .forEach((m) => out.push({ item: m, micro: true }));
  }
  return out;
}

/**
 * Gantt: una riga per macro attività, con le micro attività sotto, rientrate e con la barra
 * più sottile. La barra va da inizio a fine calcolata (inizio + giorni + giorni congelati).
 * Il tratteggio azzurro è il tempo congelato; la linea rossa verticale è "oggi".
 * Componente puramente visivo (nessuna libreria): si aggiorna a ogni render.
 */
export function GanttChart({
  phases,
  emptyText = "Nessuna macro attività: aggiungine una qui sotto per vedere il diagramma di Gantt.",
}: {
  phases: GanttItem[];
  emptyText?: string;
}) {
  if (phases.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyText}</p>;
  }

  const today = todayIso();
  const rows = orderRows(phases).map(({ item, micro }) => ({
    phase: item,
    micro,
    tl: computeTimeline({ ...item, legacy_end: null }, today),
  }));
  const hasMicro = rows.some((r) => r.micro);

  const minStart = rows.reduce((m, r) => (r.tl.start && r.tl.start < m ? r.tl.start : m), rows[0].tl.start as string);
  const maxEnd = rows.reduce((m, r) => (r.tl.end && r.tl.end > m ? r.tl.end : m), rows[0].tl.end as string);
  // includo "oggi" nell'intervallo per mostrare sempre la linea, con un po' di margine
  const rangeStart = today < minStart ? today : minStart;
  const rangeEnd = today > maxEnd ? today : maxEnd;
  const total = Math.max(1, diffDays(rangeEnd, rangeStart));

  const pct = (date: string) => (diffDays(date, rangeStart) / total) * 100;

  // tacche sull'asse: circa 6-8 etichette
  const step = DAY_LABEL_STEPS.find((s) => total / s <= 8) ?? 120;
  const ticks: string[] = [];
  for (let d = 0; d <= total; d += step) ticks.push(addDays(rangeStart, d));

  const todayLeft = pct(today);

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[640px]">
        {hasMicro && (
          <div className="flex items-center gap-4 pb-2 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-5 rounded-sm border border-primary/50 bg-primary/25" /> Macro attività
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-1.5 w-5 rounded-sm border border-primary/40 bg-primary/20" /> Micro attività
            </span>
          </div>
        )}

        {/* asse */}
        <div className="grid grid-cols-[180px_1fr] items-end gap-3 pb-1">
          <div />
          <div className="relative h-5 text-[10px] text-muted-foreground">
            {ticks.map((t) => (
              <span key={t} className="absolute -translate-x-1/2 whitespace-nowrap" style={{ left: `${pct(t)}%` }}>
                {new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "short" }).format(new Date(t))}
              </span>
            ))}
          </div>
        </div>

        <div className="relative">
          {rows.map(({ phase, tl, micro }) => {
            const start = tl.start as string;
            const end = tl.end as string;
            const left = pct(start);
            const width = Math.max(1.5, pct(end) - left);
            // la parte "lavorata" (verde) e quella congelata (tratteggio) dentro la barra
            const frozenShare = tl.frozenTotal > 0 && end > start ? Math.min(100, (tl.frozenTotal / diffDays(end, start)) * 100) : 0;
            const late = !phase.completed && end < today;
            return (
              <div
                key={phase.id}
                className={cn("grid grid-cols-[180px_1fr] items-center gap-3 border-t", micro ? "py-1" : "py-2")}
              >
                <div className={cn("flex min-w-0 items-center gap-1.5", micro ? "pl-4 text-xs" : "text-sm")}>
                  {phase.completed ? (
                    <Check className="size-3.5 shrink-0 text-success" />
                  ) : tl.frozen ? (
                    <Snowflake className="size-3.5 shrink-0 text-sky-600 dark:text-sky-300" />
                  ) : micro ? (
                    <span className="size-3.5 shrink-0 text-center leading-none text-muted-foreground/60">└</span>
                  ) : null}
                  <span className={cn("truncate", phase.completed && "text-muted-foreground line-through")} title={phase.name}>
                    {phase.name}
                  </span>
                </div>
                <div className={cn("relative", micro ? "h-4" : "h-7")}>
                  <div
                    className={cn(
                      "absolute flex items-center overflow-hidden border text-[10px]",
                      micro ? "inset-y-0.5 rounded-sm" : "inset-y-0.5 rounded-md",
                      phase.completed
                        ? "border-success/50 bg-success/25"
                        : late
                          ? "border-destructive/60 bg-destructive/20"
                          : micro
                            ? "border-primary/40 bg-primary/15"
                            : "border-primary/50 bg-primary/25"
                    )}
                    style={{ left: `${left}%`, width: `${width}%` }}
                    title={`${formatDate(start)} → ${formatDate(end)} · ${tl.durationDays} gg${tl.frozenTotal ? ` + ${tl.frozenTotal} congelati` : ""}`}
                  >
                    {!phase.completed && (
                      <div
                        className={cn("absolute inset-y-0 left-0", late ? "bg-destructive/40" : micro ? "bg-primary/35" : "bg-primary/50")}
                        style={{ width: `${tl.timePercent}%` }}
                      />
                    )}
                    {frozenShare > 0 && (
                      <div
                        className="absolute inset-y-0 right-0 bg-[repeating-linear-gradient(45deg,rgba(2,132,199,0.4)_0_4px,transparent_4px_8px)] dark:bg-[repeating-linear-gradient(45deg,rgba(125,211,252,0.35)_0_4px,transparent_4px_8px)]"
                        style={{ width: `${frozenShare}%` }}
                      />
                    )}
                    {!micro && (
                      <span className="relative z-10 truncate px-1.5 font-medium text-foreground/90">
                        {tl.durationDays} gg
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* linea di oggi */}
          <div className="pointer-events-none absolute inset-y-0 grid w-full grid-cols-[180px_1fr] gap-3">
            <div />
            <div className="relative">
              <div className="absolute inset-y-0 w-px bg-destructive/80" style={{ left: `${todayLeft}%` }}>
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 rounded bg-destructive px-1 text-[9px] text-white">
                  oggi
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
