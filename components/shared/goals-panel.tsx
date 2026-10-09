"use client";

import { useState } from "react";
import { Pencil, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DeleteButton, QuickForm, type QuickField } from "@/components/shared/quick-form";
import { GoalRing } from "@/components/shared/goal-ring";
import { GOAL_CATEGORY, GOAL_SOURCE } from "@/lib/constants/second-brain";
import type { GoalProgress } from "@/services/goals.service";
import { removeGoal, saveGoal } from "@/app/(app)/obiettivi/actions";

function goalFields(year: number, category: string): QuickField[] {
  return [
    { name: "title", label: "Nome (facoltativo per quelli automatici)", placeholder: "es. Fatturato 2026" },
    {
      name: "source",
      label: "Come si calcola",
      type: "select",
      options: Object.entries(GOAL_SOURCE).map(([value, label]) => ({ value, label })),
    },
    { name: "target", label: "Traguardo", type: "number", required: true, width: "half", placeholder: "es. 25000" },
    { name: "manual_value", label: "Valore attuale (solo manuale)", type: "number", width: "half" },
    {
      name: "category",
      label: "Categoria",
      type: "select",
      width: "half",
      options: Object.entries(GOAL_CATEGORY).map(([value, label]) => ({ value, label })),
    },
    { name: "year", label: "Dall'anno", type: "number", step: "1", width: "half" },
    {
      name: "end_year",
      label: "Fino all'anno (facoltativo)",
      type: "number",
      step: "1",
      width: "half",
      placeholder: "vuoto = solo quell'anno",
    },
    {
      name: "show_on_home",
      label: "Mostra in Home",
      type: "select",
      options: [
        { value: "yes", label: "Sì" },
        { value: "no", label: "No" },
      ],
    },
  ].map((f) => (f.name === "category" ? { ...f, options: reorder(f.options!, category) } : f)) as QuickField[];
}

function reorder(options: { value: string; label: string }[], first: string) {
  return [...options].sort((a, b) => (a.value === first ? -1 : b.value === first ? 1 : 0));
}

const ALL = "all";

/**
 * Anelli degli obiettivi + gestione (aggiungi / modifica / elimina).
 * Il menu a tendina sceglie cosa vedere: l'anno corrente (predefinito), un altro anno
 * oppure TUTTI gli obiettivi — compresi quelli che coprono più anni.
 */
export function GoalsPanel({
  goals,
  year,
  category = "general",
  emptyText = "Nessun obiettivo per quest'anno: aggiungine uno per vedere quanto ti manca.",
}: {
  goals: GoalProgress[];
  year: number;
  category?: keyof typeof GOAL_CATEGORY;
  emptyText?: string;
}) {
  const [view, setView] = useState<string>(String(year));

  // anni che hanno almeno un obiettivo (più l'anno corrente), dal più recente
  const years = new Set<number>([year]);
  for (const g of goals) for (let y = g.year; y <= g.lastYear && y <= g.year + 30; y++) years.add(y);
  const yearOptions = [...years].sort((a, b) => b - a);

  const viewAll = view === ALL;
  const shown = viewAll ? goals : goals.filter((g) => g.year <= Number(view) && Number(view) <= g.lastYear);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-medium text-muted-foreground">Obiettivi</h2>
          <Select value={view} onValueChange={setView}>
            <SelectTrigger className="h-7 w-auto gap-1.5 px-2 text-xs" aria-label="Quali obiettivi mostrare">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Tutti gli obiettivi ({goals.length})</SelectItem>
              {yearOptions.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y === year ? `Anno ${y} (corrente)` : `Anno ${y}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <QuickForm
          title="Nuovo obiettivo"
          description="Scegli da dove prende il valore: se è automatico l'anello si aggiorna da solo. Per un obiettivo su più anni indica anche l'ultimo anno."
          fields={goalFields(year, category)}
          values={{ year: viewAll ? year : Number(view), end_year: "", category, target: "" }}
          action={saveGoal}
          submitLabel="Aggiungi"
          successMessage="Obiettivo aggiunto"
          trigger={
            <Button variant="ghost" size="sm">
              <Plus /> Obiettivo
            </Button>
          }
        />
      </div>

      {shown.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {viewAll ? "Nessun obiettivo: aggiungine uno per vedere quanto ti manca." : emptyText}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
          {shown.map((g, i) => (
            <div key={g.id} className="group relative">
              <GoalRing goal={g} index={i} showPeriod={viewAll} />
              <div className="absolute right-0 top-0 flex opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                <QuickForm
                  title="Modifica obiettivo"
                  fields={goalFields(g.year, g.category)}
                  values={{
                    title: g.title,
                    source: g.source,
                    target: g.target,
                    manual_value: g.manual_value,
                    category: g.category,
                    year: g.year,
                    end_year: g.end_year,
                    show_on_home: g.show_on_home ? "yes" : "no",
                  }}
                  hidden={{ id: g.id }}
                  action={saveGoal}
                  successMessage="Obiettivo aggiornato"
                  trigger={
                    <Button variant="ghost" size="icon" aria-label="Modifica obiettivo">
                      <Pencil />
                    </Button>
                  }
                />
                <DeleteButton action={removeGoal.bind(null, g.id)} what="questo obiettivo" />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
