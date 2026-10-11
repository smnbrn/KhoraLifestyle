import Link from "next/link";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { AlertTriangle, CalendarDays, CalendarRange, FolderKanban, Sun } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GoalsPanel } from "@/components/shared/goals-panel";
import { CalendarGrid } from "@/app/(app)/calendario/calendar-grid";
import { currentYear, diffDays, todayIso } from "@/lib/dates";
import { getCurrentUser } from "@/services/auth.service";
import { getCalendarItems } from "@/services/calendar.service";
import { collectDeadlines } from "@/services/deadlines.service";
import { getGoalsProgress } from "@/services/goals.service";
import { getWorkKpis } from "@/services/dashboard.service";
import { createClient } from "@/lib/supabase/server";

function StatCard({
  icon: Icon,
  label,
  value,
  href,
  tone,
}: {
  icon: typeof Sun;
  label: string;
  value: string;
  href: string;
  tone?: "warning" | "destructive";
}) {
  return (
    <Link href={href} className="block">
      <Card className="transition-colors hover:border-primary/50">
        <CardContent className="space-y-1.5">
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Icon className="size-3.5" /> {label}
          </p>
          <p className={`text-lg font-semibold ${tone === "destructive" ? "text-destructive" : tone === "warning" ? "text-warning" : ""}`}>
            {value}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}

export default async function HomePage() {
  const user = await getCurrentUser();
  const userId = user!.id;
  const today = todayIso();
  const year = currentYear();
  const month = Number(today.slice(5, 7));
  const supabase = await createClient();

  const [goals, deadlines, calendarItems, workKpis, { data: profile }] = await Promise.all([
    getGoalsProgress(userId, year, { homeOnly: true }),
    collectDeadlines(userId),
    getCalendarItems(userId, year, month),
    getWorkKpis(userId),
    supabase.from("profiles").select("full_name").eq("id", userId).maybeSingle(),
  ]);

  const firstName = (profile?.full_name ?? "").trim().split(/\s+/)[0];
  const todays = deadlines.filter((d) => d.date === today && !d.overdue);
  const week = deadlines.filter((d) => {
    const delta = diffDays(today, d.date);
    return delta >= 0 && delta <= 7;
  });
  const overdue = deadlines.filter((d) => d.overdue);
  const upcoming = deadlines.filter((d) => !d.overdue && diffDays(today, d.date) >= 0).slice(0, 6);

  const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

  return (
    <div className="space-y-8 px-4 py-6 md:px-6 md:py-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{firstName ? `Ciao, ${firstName}.` : "Ciao."}</h1>
        <p className="text-sm capitalize text-muted-foreground">{format(new Date(), "EEEE d MMMM yyyy", { locale: it })}</p>
      </div>

      <GoalsPanel goals={goals} year={year} category="general" />

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">Oggi in breve</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard icon={Sun} label="Oggi" value={plural(todays.length, "scadenza", "scadenze")} href="/calendario" />
          <StatCard icon={CalendarRange} label="Prossimi 7 giorni" value={plural(week.length, "scadenza", "scadenze")} href="/calendario" />
          <StatCard icon={FolderKanban} label="Progetti" value={plural(workKpis.activeProjects, "attivo", "attivi")} href="/progetti" />
          <StatCard
            icon={AlertTriangle}
            label="Alert"
            value={plural(overdue.length, "scaduto", "scadute")}
            href="/calendario"
            tone={overdue.length > 0 ? "destructive" : undefined}
          />
        </div>
      </section>

      {/* Griglia a due righe: intestazione + frase, poi calendario (col. 1-2) e box (col. 3).
          Il box sta nella seconda riga, quindi parte esattamente all'altezza della tabella. */}
      <section className="grid gap-x-4 gap-y-3 xl:grid-cols-3">
        <div className="space-y-1 xl:col-span-2">
          <h2 className="text-sm font-medium text-muted-foreground">Calendario</h2>
          <p className="text-xs text-muted-foreground">Passa il mouse su una voce per segnarla come «Fatto» o eliminarla.</p>
        </div>

        <div className="xl:col-span-2">
          <CalendarGrid monthDate={new Date(year, month - 1, 1)} items={calendarItems} compact showHint={false} />
        </div>

        <Card className="h-fit xl:col-start-3 xl:row-start-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="size-4" /> Prossime scadenze
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcoming.length === 0 && <p className="text-sm text-muted-foreground">Niente in arrivo.</p>}
            {upcoming.map((d) => (
              <Link key={`${d.type}-${d.id}`} href={d.href} className="flex items-start justify-between gap-3 text-sm hover:text-primary">
                <span className="min-w-0">
                  <span className="block truncate">{d.label}</span>
                  {d.sublabel && <span className="block truncate text-xs text-muted-foreground">{d.sublabel}</span>}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">{format(new Date(`${d.date}T00:00:00`), "d MMM", { locale: it })}</span>
              </Link>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
