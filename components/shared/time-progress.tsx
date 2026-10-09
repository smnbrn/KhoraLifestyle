import { Snowflake } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";
import type { Timeline } from "@/lib/timeline";

/** Testo sintetico sullo stato del tempo: "12 giorni rimasti", "3 giorni di ritardo"… */
export function timeStatusText(tl: Timeline, completed = false): string {
  if (completed) return "Completato";
  if (tl.daysToEnd == null) return "Nessuna scadenza";
  if (tl.notStarted) return "Non ancora iniziato";
  const d = tl.daysToEnd;
  if (d < 0) return `${Math.abs(d)} ${Math.abs(d) === 1 ? "giorno" : "giorni"} di ritardo`;
  if (d === 0) return "Scade oggi";
  return `${d} ${d === 1 ? "giorno rimasto" : "giorni rimasti"}`;
}

function Bar({ percent, className }: { percent: number; className?: string }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-border">
      <div
        className={cn("h-full rounded-full transition-all", className)}
        style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
      />
    </div>
  );
}

/**
 * Due barre: sopra lo scorrimento del TEMPO, sotto il progresso REALE.
 * Se il tempo è avanti rispetto al lavoro fatto, la barra del tempo diventa
 * gialla/rossa: a colpo d'occhio si vede se si è in ritardo.
 */
export function DualProgress({
  timeline,
  progressPercent,
  progressLabel,
  completed = false,
  compact = false,
}: {
  timeline: Timeline;
  progressPercent: number;
  progressLabel?: string;
  completed?: boolean;
  compact?: boolean;
}) {
  const late = !completed && timeline.daysToEnd != null && timeline.daysToEnd < 0;
  const behind = !completed && timeline.timePercent - progressPercent > 15;
  const timeColor = late ? "bg-destructive" : behind ? "bg-warning" : "bg-muted-foreground";

  return (
    <div className="space-y-2">
      <div>
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            Tempo
            {timeline.durationDays != null && !timeline.notStarted && (
              <span className="tabular text-[11px]">
                · giorno {timeline.elapsedDays} di {timeline.durationDays}
              </span>
            )}
            {timeline.frozen && (
              <span className="inline-flex items-center gap-1 rounded bg-sky-500/15 px-1.5 py-0.5 text-[10px] font-medium text-sky-700 dark:text-sky-300">
                <Snowflake className="size-3" /> congelato
              </span>
            )}
          </span>
          <span className={cn("tabular", late && "font-medium text-destructive")}>
            {timeline.end ? `${formatDate(timeline.end)} · ` : ""}
            {timeStatusText(timeline, completed)}
          </span>
        </div>
        <Bar percent={timeline.timePercent} className={timeColor} />
      </div>
      <div>
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Progresso</span>
          <span className="tabular font-medium">{progressPercent}%</span>
        </div>
        <Bar percent={progressPercent} className="bg-primary" />
        {!compact && progressLabel && <p className="mt-1 text-xs text-muted-foreground">{progressLabel}</p>}
      </div>
    </div>
  );
}
