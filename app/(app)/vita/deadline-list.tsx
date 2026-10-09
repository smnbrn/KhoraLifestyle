import { CalendarClock, Check, Pencil, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ActionButton, DeleteButton, QuickForm, type QuickField } from "@/components/shared/quick-form";
import { DEADLINE_KIND, RECURRENCE } from "@/lib/constants/second-brain";
import { diffDays, todayIso } from "@/lib/dates";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import type { DeadlineListItem } from "@/services/life.service";
import { payDeadline, removeDeadline, saveDeadline } from "./actions";

export function deadlineFields(kinds: (keyof typeof DEADLINE_KIND)[]): QuickField[] {
  return [
    {
      name: "kind",
      label: "Tipo",
      type: "select",
      width: "half",
      options: kinds.map((k) => ({ value: k, label: DEADLINE_KIND[k] })),
    },
    { name: "due_date", label: "Scadenza", type: "date", required: true, width: "half" },
    { name: "title", label: "Titolo (facoltativo)", placeholder: "es. Assicurazione RC" },
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
      description="Se si ripete, dopo «Pagato» slitta da sola al prossimo periodo."
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
        const delta = diffDays(today, d.due_date);
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
              {formatDate(d.due_date)}
              {overdue ? ` · ${-delta} gg fa` : delta === 0 ? " · oggi" : ` · tra ${delta} gg`}
            </span>
            <div className="flex items-center">
              <ActionButton action={payDeadline.bind(null, d.id)} variant="ghost" successMessage="Segnato come pagato">
                <Check /> Pagato
              </ActionButton>
              <QuickForm
                title="Modifica scadenza"
                fields={deadlineFields(kinds)}
                values={{
                  kind: d.kind,
                  due_date: d.due_date,
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
