import { Pencil, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeleteButton, QuickForm, type QuickField } from "@/components/shared/quick-form";
import { RENT_FREQUENCY } from "@/lib/constants/second-brain";
import { addDays, diffDays, todayIso } from "@/lib/dates";
import { rentOccurrencesInRange } from "@/lib/rent";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getCurrentUser } from "@/services/auth.service";
import { listDeadlines, listRentals, rentToMonthly } from "@/services/life.service";
import { removeRental, saveRental } from "../actions";
import { AddDeadlineButton, DeadlineList } from "../deadline-list";

const KINDS = ["rent", "imu", "other"] as const;

const rentalFields: QuickField[] = [
  { name: "name", label: "Nome", required: true, placeholder: "es. Casa 1" },
  { name: "address", label: "Indirizzo" },
  { name: "tenant_name", label: "Inquilino", width: "half" },
  { name: "imu_amount", label: "IMU annua (€)", type: "number", width: "half" },
  { name: "rent_amount", label: "Affitto che percepisci (€)", type: "number", width: "half" },
  {
    name: "rent_frequency",
    label: "Ogni quanto",
    type: "select",
    width: "half",
    options: Object.entries(RENT_FREQUENCY).map(([value, label]) => ({ value, label })),
  },
  {
    name: "rent_day",
    label: "Giorno del mese in cui incassi (1-31)",
    type: "number",
    step: "1",
    width: "half",
    placeholder: "es. 5",
  },
  { name: "contract_start", label: "Inizio contratto", type: "date", width: "half" },
  { name: "contract_end", label: "Fine contratto", type: "date", width: "half" },
  { name: "notes", label: "Note", type: "textarea" },
];

export default async function AffittiPage() {
  const user = await getCurrentUser();
  const userId = user!.id;
  const today = todayIso();

  const [rentals, deadlines] = await Promise.all([listRentals(userId), listDeadlines(userId)]);
  const monthlyTotal = rentals.reduce((s, r) => s + rentToMonthly(Number(r.rent_amount), r.rent_frequency), 0);

  return (
    <div className="space-y-6 px-4 py-6 md:px-6 md:py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Affitti</h1>
          <p className="text-sm text-muted-foreground">
            {rentals.length > 0
              ? `Incassi stimati: ${formatCurrency(monthlyTotal)} al mese · ${formatCurrency(monthlyTotal * 12)} all'anno`
              : "Aggiungi una casa: affitto, IMU e scadenza del contratto."}
          </p>
        </div>
        <QuickForm
          title="Nuova casa"
          fields={rentalFields}
          action={saveRental}
          submitLabel="Aggiungi"
          successMessage="Casa aggiunta"
          trigger={
            <Button>
              <Plus /> Casa
            </Button>
          }
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {rentals.map((r) => {
          const toEnd = r.contract_end ? diffDays(today, r.contract_end) : null;
          const nextIncome = r.rent_day ? rentOccurrencesInRange(r, today, addDays(today, 400))[0] : undefined;
          return (
            <Card key={r.id}>
              <CardHeader className="flex-row items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-base">{r.name}</CardTitle>
                  <p className="text-xs text-muted-foreground">{[r.address, r.tenant_name].filter(Boolean).join(" · ")}</p>
                </div>
                <div className="flex items-center">
                  <QuickForm
                    title="Modifica casa"
                    fields={rentalFields}
                    values={{
                      name: r.name,
                      address: r.address,
                      tenant_name: r.tenant_name,
                      imu_amount: r.imu_amount,
                      rent_amount: r.rent_amount,
                      rent_frequency: r.rent_frequency,
                      rent_day: r.rent_day,
                      contract_start: r.contract_start,
                      contract_end: r.contract_end,
                      notes: r.notes,
                    }}
                    hidden={{ id: r.id }}
                    action={saveRental}
                    successMessage="Casa aggiornata"
                    trigger={
                      <Button variant="ghost" size="icon" aria-label="Modifica">
                        <Pencil />
                      </Button>
                    }
                  />
                  <DeleteButton action={removeRental.bind(null, r.id)} what={`«${r.name}»`} />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Affitto</p>
                    <p className="tabular">
                      {formatCurrency(Number(r.rent_amount))}{" "}
                      <span className="text-xs text-muted-foreground">{RENT_FREQUENCY[r.rent_frequency]}</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Incasso</p>
                    {r.rent_day ? (
                      <p>
                        {r.rent_frequency === "monthly" ? `il ${r.rent_day} di ogni mese` : `il giorno ${r.rent_day}`}
                        {nextIncome && (
                          <span className="block text-xs text-muted-foreground">prossimo: {formatDate(nextIncome)}</span>
                        )}
                      </p>
                    ) : (
                      <p className="text-muted-foreground">—</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">IMU annua</p>
                    <p className="tabular">{r.imu_amount != null ? formatCurrency(Number(r.imu_amount)) : "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Contratto fino al</p>
                    <p className={toEnd != null && toEnd < 60 ? "text-warning" : ""}>
                      {r.contract_end ? formatDate(r.contract_end) : "—"}
                      {toEnd != null && (
                        <span className="block text-xs text-muted-foreground">
                          {toEnd < 0 ? "scaduto" : `tra ${toEnd} giorni`}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 border-t pt-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-muted-foreground">Scadenze (affitto, IMU…)</p>
                    <AddDeadlineButton owner={{ rental_id: r.id }} kinds={[...KINDS]} />
                  </div>
                  <DeadlineList deadlines={deadlines.filter((d) => d.rental_id === r.id)} kinds={[...KINDS]} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
