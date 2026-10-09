import Link from "next/link";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Building2, Car, Dumbbell, Plane } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GoalsPanel } from "@/components/shared/goals-panel";
import { currentYear, diffDays, todayIso } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { getCurrentUser } from "@/services/auth.service";
import { collectDeadlines } from "@/services/deadlines.service";
import { getGoalsProgress } from "@/services/goals.service";
import { listRentals, listTrips, listVehicles, listWorkoutsInRange, workoutStats } from "@/services/life.service";

const LIFE_TYPES = new Set(["rental", "vehicle", "trip"]);

export default async function VitaPage() {
  const user = await getCurrentUser();
  const userId = user!.id;
  const today = todayIso();
  const year = currentYear();

  const [goals, deadlines, rentals, vehicles, trips, workouts] = await Promise.all([
    getGoalsProgress(userId, year, { category: "life" }),
    collectDeadlines(userId),
    listRentals(userId),
    listVehicles(userId),
    listTrips(userId),
    listWorkoutsInRange(userId, `${year - 1}-01-01`, today),
  ]);

  const stats = workoutStats(
    workouts.map((w) => w.workout_date),
    today
  );
  const lifeDeadlines = deadlines.filter((d) => LIFE_TYPES.has(d.type)).slice(0, 8);
  const nextTrip = trips.find((t) => t.status !== "done" && t.start_date && t.start_date >= today);

  const tiles = [
    { href: "/vita/affitti", icon: Building2, label: "Affitti", value: `${rentals.length}`, hint: rentals.length === 1 ? "casa" : "case" },
    { href: "/vita/allenamenti", icon: Dumbbell, label: "Allenamenti", value: `${stats.inMonth}`, hint: "questo mese" },
    {
      href: "/vita/viaggi",
      icon: Plane,
      label: "Viaggi",
      value: nextTrip ? `${diffDays(today, nextTrip.start_date!)} gg` : `${trips.filter((t) => t.status !== "done").length}`,
      hint: nextTrip ? `a ${nextTrip.name}` : "in programma",
    },
    { href: "/vita/veicoli", icon: Car, label: "Veicoli", value: `${vehicles.length}`, hint: vehicles.length === 1 ? "veicolo" : "veicoli" },
  ];

  return (
    <div className="space-y-8 px-4 py-6 md:px-6 md:py-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Vita</h1>
        <p className="text-sm text-muted-foreground">Casa, corpo, viaggi e veicoli — tutto ciò che non è lavoro.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map((t) => (
          <Link key={t.href} href={t.href}>
            <Card className="h-full transition-colors hover:border-primary/50">
              <CardContent className="space-y-1">
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <t.icon className="size-3.5" /> {t.label}
                </p>
                <p className="text-2xl font-semibold">{t.value}</p>
                <p className="truncate text-xs text-muted-foreground">{t.hint}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <GoalsPanel goals={goals} year={year} category="life" emptyText="Aggiungi un obiettivo (es. giorni di allenamento o di viaggio)." />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Prossime scadenze</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {lifeDeadlines.length === 0 && <p className="text-sm text-muted-foreground">Nessuna scadenza in vista.</p>}
          {lifeDeadlines.map((d) => (
            <Link key={`${d.type}-${d.id}`} href={d.href} className="flex items-center justify-between gap-3 text-sm hover:text-primary">
              <span className="min-w-0">
                <span className="block truncate">{d.label}</span>
                {d.sublabel && <span className="block truncate text-xs text-muted-foreground">{d.sublabel}</span>}
              </span>
              <span className={cn("shrink-0 text-xs", d.overdue ? "text-destructive" : "text-muted-foreground")}>
                {format(new Date(`${d.date}T00:00:00`), "d MMM yyyy", { locale: it })}
              </span>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
