import { CalendarClock, Check, Pencil, Plus, Snowflake } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ActionButton, DeleteButton, QuickForm, type QuickField } from "@/components/shared/quick-form";
import { TimelineSwitch } from "@/components/shared/timeline-switch";
import { DEADLINE_KIND, RECURRENCE } from "@/lib/constants/second-brain";
import { computeTimeline } from "@/lib/timeline";
import { diffDays, todayIso } from "@/lib/dates";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import type { DeadlineListItem } from "@/services/life.service";
import { payDeadline, removeDeadline, saveDeadline, setDeadlineTimelineRunning } from "./actions";

export function deadlineFields(kinds: (keyof typeof DEADLINE_KIND)[]): QuickField[] {
  return [
    {
      name: "kind",
      label: "Tipo",
      type: "select",
      width: "half",
      options: kinds.map((k) => ({ value: k, label: DEADLINE_KIND[k] })),
    },
    { name: "title", label: "Titolo (facoltativo)", placeholder: "es. Assicurazione RC" },
    // Due modi per dire quando scade: una data fissa, oppure inizio + giorni (come nei progetti:
    // i giorni scorrono, si possono congelare e i giorni di blocco si sommano).
    { name: "due_date", label: "Scadenza a data fissa", type: "date", width: "half" },
    { name: "start_date", label: "…oppure: data di inizio", type: "date", width: "half" },
    {
      name: "duration_days",
      label: "…e durata in giorni (la scadenza si calcola)",
      type: "number",
      step: "1",
      placeholder: "es. 365",
    },
    { name: "amount", label: "Importo (€)", type: "number", width: "half" },
    {
      name: "recurrence",
      label: "Si ripete",
      type: "select",
      width: "half",
      options: Object.entries(RECURRENCE).map(([value, label]) => ({ value, label })),
    },
  ];
}

export function AddDeadlineButton({
  owner,
  kinds,
}: {
  owner: { rental_id: string } | { vehicle_id: string };
  kinds: (keyof typeof DEADLINE_KIND)[];
}) {
  return (
    <QuickForm
      title="Nuova scadenza"
      description="Metti una data fissa, oppure inizio + giorni: così il tempo scorre, lo puoi congelare e i giorni di blocco si sommano. Se si ripete, dopo «Pagato» riparte da sola."
      fields={deadlineFields(kinds)}
      hidden={owner}
      action={saveDeadline}
      successMessage="Scadenza aggiunta"
      trigger={
        <Button variant="ghost" size="sm">
          <Plus /> Scadenza
        </Button>
      }
    />
  );
}

/** Elenco delle scadenze di un affitto o di un veicolo. */
export function DeadlineList({
  deadlines,
  kinds,
}: {
  deadlines: DeadlineListItem[];
  kinds: (keyof typeof DEADLINE_KIND)[];
}) {
  const today = todayIso();
  if (deadlines.length === 0) return <p className="text-xs text-muted-foreground">Nessuna scadenza.</p>;

  return (
    <div className="space-y-2">
      {deadlines.map((d) => {
        // stesso calcolo dei progetti: inizio + giorni + giorni congelati (altrimenti vale la data fissa)
        const tl = computeTimeline({ ...d, legacy_end: d.due_date }, today);
        const dueDate = tl.end ?? d.due_date;
        const delta = diffDays(today, dueDate);
        const overdue = delta < 0;
        return (
          <div key={d.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <CalendarClock className={cn("size-3.5 shrink-0", overdue ? "text-destructive" : "text-muted-foreground")} />
            <span className="min-w-0 flex-1 truncate">
              {d.title}
              {d.recurrence !== "none" && (
                <Badge variant="outline" className="ml-2">
                  {RECURRENCE[d.recurrence]}
                </Badge>
              )}
            </span>
            {d.amount != null && <span className="tabular text-muted-foreground">{formatCurrency(Number(d.amount))}</span>}
            <span className={cn("tabular text-xs", overdue ? "text-destructive" : "text-muted-foreground")}>
              {formatDate(dueDate)}
              {overdue ? ` · ${-delta} gg fa` : delta === 0 ? " · oggi" : ` · tra ${delta} gg`}
            </span>
            {tl.hasDuration && (
              <span className="flex items-center gap-2 text-[11px] text-muted-foreground">
                {!tl.notStarted && (
                  <span className="tabular">
                    giorno {tl.elapsedDays} di {tl.durationDays}
                    {tl.frozenTotal > 0 && ` + ${tl.frozenTotal} congelati`}
                  </span>
                )}
                {tl.frozen && (
                  <span className="inline-flex items-center gap-1 rounded bg-sky-500/15 px-1.5 py-0.5 text-[10px] font-medium text-sky-700 dark:text-sky-300">
                    <Snowflake className="size-3" /> congelata
                  </span>
                )}
                <TimelineSwitch running={d.timeline_running} action={setDeadlineTimelineRunning.bind(null, d.id)} />
              </span>
            )}
            <div className="flex items-center">
              <ActionButton action={payDeadline.bind(null, d.id)} variant="ghost" successMessage="Segnato come pagato">
                <Check /> Pagato
              </ActionButton>
              <QuickForm
                title="Modifica scadenza"
                fields={deadlineFields(kinds)}
                values={{
                  kind: d.kind,
                  // se la scadenza è calcolata da inizio + giorni, la data fissa resta vuota
                  due_date: tl.hasDuration ? null : d.due_date,
                  start_date: d.start_date,
                  duration_days: d.duration_days,
                  title: d.title,
                  amount: d.amount,
                  recurrence: d.recurrence,
                }}
                hidden={{ id: d.id, ...(d.rental_id ? { rental_id: d.rental_id } : { vehicle_id: d.vehicle_id ?? "" }) }}
                action={saveDeadline}
                successMessage="Scadenza aggiornata"
                trigger={
                  <Button variant="ghost" size="icon" aria-label="Modifica scadenza">
                    <Pencil />
                  </Button>
                }
              />
              <DeleteButton action={removeDeadline.bind(null, d.id)} what="questa scadenza" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
