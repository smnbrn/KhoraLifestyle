import Link from "next/link";
import { Snowflake, FolderKanban, PlayCircle, Users } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DualProgress, timeStatusText } from "@/components/shared/time-progress";
import { GoalsPanel } from "@/components/shared/goals-panel";
import { computeTimeline } from "@/lib/timeline";
import { currentYear, todayIso } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/services/auth.service";
import { getGoalsProgress } from "@/services/goals.service";
import { getProjectsProgress, listOpenProjects } from "@/services/projects.service";

export default async function LavoroPage() {
  const user = await getCurrentUser();
  const userId = user!.id;
  const today = todayIso();
  const year = currentYear();
  const supabase = await createClient();

  const [goals, projects, { count: activeClients }, { count: newClients }] = await Promise.all([
    getGoalsProgress(userId, year, { category: "work" }),
    listOpenProjects(userId),
    supabase.from("clients").select("id", { count: "exact", head: true }).eq("user_id", userId).is("archived_at", null),
    supabase
      .from("clients")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", `${year}-01-01`),
  ]);

  const progress = await getProjectsProgress(
    userId,
    projects.map((p) => p.id)
  );

  const rows = projects.map((p) => ({ project: p, timeline: computeTimeline(p, today) }));
  const frozen = rows.filter((r) => r.timeline.frozen).length;
  const running = rows.filter((r) => p_inProgress(r.project.status) && !r.timeline.frozen).length;
  const late = rows.filter(
    (r) =>
      r.timeline.hasDuration &&
      r.timeline.daysToEnd != null &&
      r.timeline.daysToEnd < 0 &&
      !progress[r.project.id]?.allDone // finito (tutte le macro completate) = non in ritardo
  ).length;

  const stats = [
    { label: "Clienti acquisiti", value: `${newClients ?? 0}`, hint: `nel ${year} · ${activeClients ?? 0} attivi`, icon: Users },
    { label: "Progetti attivi", value: `${projects.length}`, hint: late > 0 ? `${late} in ritardo` : "aperti", icon: FolderKanban },
    { label: "In corso", value: `${running}`, hint: "tempo che scorre", icon: PlayCircle },
    { label: "Congelati", value: `${frozen}`, hint: "tempo fermo", icon: Snowflake },
  ];

  return (
    <div className="space-y-8 px-4 py-6 md:px-6 md:py-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Lavoro</h1>
        <p className="text-sm text-muted-foreground">Clienti, progetti e task in un colpo d&apos;occhio.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="space-y-1">
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <s.icon className="size-3.5" /> {s.label}
              </p>
              <p className="text-2xl font-semibold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <GoalsPanel goals={goals} year={year} category="work" emptyText="Nessun obiettivo di lavoro: aggiungine uno (es. clienti da acquisire)." />

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">Progetti aperti</CardTitle>
          <Link href="/progetti" className="text-xs text-primary hover:underline">
            Tutti i progetti
          </Link>
        </CardHeader>
        <CardContent className="space-y-5">
          {rows.length === 0 && <p className="text-sm text-muted-foreground">Nessun progetto aperto.</p>}
          {rows.map(({ project, timeline }) => (
            <Link key={project.id} href={`/progetti/${project.id}`} className="block space-y-2 hover:opacity-90">
              <div className="flex items-baseline justify-between gap-3">
                <span className="truncate text-sm font-medium">{project.name}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {timeline.frozen ? "Congelato · " : ""}
                  {timeStatusText(timeline, !!progress[project.id]?.allDone)}
                </span>
              </div>
              <DualProgress
                timeline={timeline}
                progressPercent={progress[project.id]?.percent ?? 0}
                progressLabel={progress[project.id]?.label}
                completed={!!progress[project.id]?.allDone}
                compact
              />
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function p_inProgress(status: string) {
  return status === "in_progress";
}
