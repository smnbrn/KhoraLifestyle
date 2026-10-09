import Link from "next/link";
import { ArrowLeft, Pencil, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeleteButton, QuickForm, type QuickField } from "@/components/shared/quick-form";
import { GoalsPanel } from "@/components/shared/goals-panel";
import { INVESTMENT_KIND, MOVEMENT_KIND } from "@/lib/constants/second-brain";
import { currentYear, todayIso } from "@/lib/dates";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { getCurrentUser } from "@/services/auth.service";
import { getGoalsProgress } from "@/services/goals.service";
import { listInvestments, listMovements, summarizeInvestments } from "@/services/investments.service";
import { addMovement, removeInvestment, removeMovement, saveInvestment } from "./actions";

const investmentFields: QuickField[] = [
  { name: "name", label: "Nome", required: true, placeholder: "es. ETF MSCI World" },
  {
    name: "kind",
    label: "Tipo",
    type: "select",
    width: "half",
    options: Object.entries(INVESTMENT_KIND).map(([value, label]) => ({ value, label })),
  },
  { name: "current_value", label: "Valore attuale (€)", type: "number", width: "half" },
  { name: "notes", label: "Note", type: "textarea" },
];

const movementFields: QuickField[] = [
  {
    name: "kind",
    label: "Operazione",
    type: "select",
    width: "half",
    options: Object.entries(MOVEMENT_KIND).map(([value, label]) => ({ value, label })),
  },
  { name: "amount", label: "Importo (€)", type: "number", required: true, width: "half" },
  { name: "movement_date", label: "Data", type: "date", width: "half" },
  { name: "notes", label: "Note", width: "half" },
];

function Gain({ value, percent }: { value: number | null; percent: number | null }) {
  if (value == null) return <span className="text-muted-foreground">—</span>;
  return (
    <span className={cn("tabular", value >= 0 ? "text-success" : "text-destructive")}>
      {value >= 0 ? "+" : ""}
      {formatCurrency(value)}
      {percent != null && ` (${percent >= 0 ? "+" : ""}${percent.toFixed(1)}%)`}
    </span>
  );
}

export default async function InvestimentiPage() {
  const user = await getCurrentUser();
  const userId = user!.id;
  const year = currentYear();

  const [items, goals] = await Promise.all([
    listInvestments(userId),
    getGoalsProgress(userId, year, { category: "finance" }),
  ]);
  const summary = summarizeInvestments(items);
  const movements = await Promise.all(items.map((i) => listMovements(userId, i.id)));
  const totalForBars = summary.allocation.reduce((s, a) => s + a.value, 0);

  return (
    <div className="space-y-8 px-4 py-6 md:px-6 md:py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/finanze" className="mb-1 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-3" /> Finanze
          </Link>
          <h1 className="text-2xl font-semibold text-foreground">Investimenti</h1>
          <p className="text-sm text-muted-foreground">Quanto hai versato, quanto vale oggi, quanto hai guadagnato.</p>
        </div>
        <QuickForm
          title="Nuovo investimento"
          fields={investmentFields}
          action={saveInvestment}
          submitLabel="Aggiungi"
          successMessage="Investimento aggiunto"
          trigger={
            <Button>
              <Plus /> Investimento
            </Button>
          }
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="space-y-1">
            <p className="text-xs text-muted-foreground">Versato</p>
            <p className="tabular text-2xl font-semibold">{formatCurrency(summary.invested)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-1">
            <p className="text-xs text-muted-foreground">Valore attuale</p>
            <p className="tabular text-2xl font-semibold">{formatCurrency(summary.currentValue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-1">
            <p className="text-xs text-muted-foreground">Guadagno / perdita</p>
            <p className="text-2xl font-semibold">
              <Gain value={summary.gain} percent={summary.gainPercent} />
            </p>
          </CardContent>
        </Card>
      </div>

      <GoalsPanel
        goals={goals}
        year={year}
        category="finance"
        emptyText="Aggiungi un obiettivo (es. «Guadagni» o «Investimenti») per vederlo anche in Home."
      />

      {summary.allocation.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ripartizione</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {summary.allocation
              .sort((a, b) => b.value - a.value)
              .map((a) => {
                const pct = totalForBars > 0 ? (a.value / totalForBars) * 100 : 0;
                return (
                  <div key={a.kind} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{INVESTMENT_KIND[a.kind as keyof typeof INVESTMENT_KIND] ?? a.kind}</span>
                      <span className="tabular text-muted-foreground">
                        {formatCurrency(a.value)} · {pct.toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-border">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {items.length === 0 && (
          <p className="text-sm text-muted-foreground">Nessun investimento: aggiungine uno e registra versamenti e prelievi.</p>
        )}
        {items.map((inv, idx) => (
          <Card key={inv.id}>
            <CardHeader className="flex-row items-start justify-between gap-3">
              <div className="space-y-1">
                <CardTitle className="text-base">{inv.name}</CardTitle>
                <Badge variant="outline">{INVESTMENT_KIND[inv.kind as keyof typeof INVESTMENT_KIND]}</Badge>
              </div>
              <div className="flex items-center">
                <QuickForm
                  title="Modifica investimento"
                  fields={investmentFields}
                  values={{ name: inv.name, kind: inv.kind, current_value: inv.current_value, notes: inv.notes }}
                  hidden={{ id: inv.id }}
                  action={saveInvestment}
                  successMessage="Investimento aggiornato"
                  trigger={
                    <Button variant="ghost" size="icon" aria-label="Modifica">
                      <Pencil />
                    </Button>
                  }
                />
                <DeleteButton action={removeInvestment.bind(null, inv.id)} what={`«${inv.name}» con tutti i movimenti`} />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Versato</p>
                  <p className="tabular">{formatCurrency(inv.invested)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Valore</p>
                  <p className="tabular">{inv.current_value != null ? formatCurrency(Number(inv.current_value)) : "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Risultato</p>
                  <Gain value={inv.gain} percent={inv.gainPercent} />
                </div>
              </div>

              <div className="space-y-2 border-t pt-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground">Movimenti</p>
                  <QuickForm
                    title={`Movimento · ${inv.name}`}
                    fields={movementFields}
                    values={{ movement_date: todayIso() }}
                    hidden={{ investment_id: inv.id }}
                    action={addMovement}
                    successMessage="Movimento registrato"
                    trigger={
                      <Button variant="ghost" size="sm">
                        <Plus /> Movimento
                      </Button>
                    }
                  />
                </div>
                {movements[idx].length === 0 && <p className="text-xs text-muted-foreground">Nessun movimento.</p>}
                {movements[idx].map((m) => (
                  <div key={m.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-muted-foreground">{formatDate(m.movement_date)}</span>
                    <span className="flex-1 truncate text-xs text-muted-foreground">{m.notes}</span>
                    <span className={cn("tabular", m.kind === "deposit" ? "" : "text-warning")}>
                      {m.kind === "deposit" ? "+" : "−"}
                      {formatCurrency(Number(m.amount))}
                    </span>
                    <DeleteButton action={removeMovement.bind(null, m.id)} what="questo movimento" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
