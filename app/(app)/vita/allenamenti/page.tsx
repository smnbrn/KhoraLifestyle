import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GoalsPanel } from "@/components/shared/goals-panel";
import { currentYear, todayIso } from "@/lib/dates";
import { getCurrentUser } from "@/services/auth.service";
import { getGoalsProgress } from "@/services/goals.service";
import { listWorkoutsInRange, workoutStats } from "@/services/life.service";
import { WorkoutGrid } from "./workout-grid";

function href(year: number, month: number) {
  return `/vita/allenamenti?anno=${year}&mese=${month}`;
}

export default async function AllenamentiPage({
  searchParams,
}: {
  searchParams: Promise<{ anno?: string; mese?: string }>;
}) {
  const params = await searchParams;
  const user = await getCurrentUser();
  const userId = user!.id;
  const today = todayIso();
  const nowYear = currentYear();

  const year = Number(params.anno) || nowYear;
  const month = Math.min(12, Math.max(1, Number(params.mese) || Number(today.slice(5, 7))));
  const prev = month === 1 ? { y: year - 1, m: 12 } : { y: year, m: month - 1 };
  const next = month === 12 ? { y: year + 1, m: 1 } : { y: year, m: month + 1 };

  const pad = (n: number) => String(n).padStart(2, "0");
  const lastDay = new Date(year, month, 0).getDate();

  // Per statistiche e serie servono almeno gli ultimi mesi: prendo l'anno corrente + il precedente.
  const [monthRows, statRows, goals] = await Promise.all([
    listWorkoutsInRange(userId, `${year}-${pad(month)}-01`, `${year}-${pad(month)}-${pad(lastDay)}`),
    listWorkoutsInRange(userId, `${nowYear - 1}-01-01`, today),
    getGoalsProgress(userId, nowYear, { category: "life" }),
  ]);
  const stats = workoutStats(
    statRows.map((w) => w.workout_date),
    today
  );

  const kpis = [
    { label: "Questo mese", value: stats.inMonth },
    { label: "Ultimi 7 giorni", value: stats.last7 },
    { label: `Nel ${nowYear}`, value: stats.inYear },
    { label: "Serie in corso", value: stats.streak, suffix: stats.streak === 1 ? "giorno" : "giorni" },
  ];

  return (
    <div className="space-y-8 px-4 py-6 md:px-6 md:py-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Allenamenti</h1>
        <p className="text-sm text-muted-foreground">Tocca un giorno per segnare che ti sei allenato.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardContent className="space-y-1">
              <p className="text-xs text-muted-foreground">{k.label}</p>
              <p className="text-2xl font-semibold">
                {k.value} {k.suffix && <span className="text-sm font-normal text-muted-foreground">{k.suffix}</span>}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-4">
        <div className="flex max-w-md items-center justify-between">
          <h2 className="text-lg font-medium capitalize">{format(new Date(year, month - 1, 1), "MMMM yyyy", { locale: it })}</h2>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" asChild>
              <Link href={href(prev.y, prev.m)} aria-label="Mese precedente">
                <ChevronLeft />
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/vita/allenamenti">Oggi</Link>
            </Button>
            <Button variant="outline" size="icon" asChild>
              <Link href={href(next.y, next.m)} aria-label="Mese successivo">
                <ChevronRight />
              </Link>
            </Button>
          </div>
        </div>
        <WorkoutGrid year={year} month={month} trained={monthRows.map((w) => w.workout_date)} today={today} />
      </div>

      <GoalsPanel goals={goals} year={nowYear} category="life" emptyText="Aggiungi un obiettivo «Giorni di allenamento» per vedere quanti te ne mancano." />
    </div>
  );
}
