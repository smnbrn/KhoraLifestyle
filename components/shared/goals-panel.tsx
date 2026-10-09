import { Pencil, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
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
    { name: "year", label: "Anno", type: "number", step: "1", width: "half" },
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

/** Anelli degli obiettivi + gestione (aggiungi / modifica / elimina). */
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
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted-foreground">Obiettivi {year}</h2>
        <QuickForm
          title="Nuovo obiettivo"
          description="Scegli da dove prende il valore: se è automatico l'anello si aggiorna da solo."
          fields={goalFields(year, category)}
          values={{ year, category, target: "" }}
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

      {goals.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
          {goals.map((g, i) => (
            <div key={g.id} className="group relative">
              <GoalRing goal={g} index={i} />
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
