import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NotesTab } from "@/components/shared/notes-tab";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PROJECT_STATUS, PRIORITY } from "@/lib/constants";
import { getCurrentUser } from "@/services/auth.service";
import { getProjectById, getProjectFinancials, listActiveClientsForSelect } from "@/services/projects.service";
import { listProjectNotes } from "@/services/notes.service";
import { listTasksByProject } from "@/services/relations.service";
import { ProjectFormDialog } from "../project-form-dialog";
import { DocumentList } from "@/components/shared/document-list";
import { DocumentUploadDialog } from "@/components/shared/document-upload-dialog";
import { listDocumentsByProject } from "@/services/documents.service";
import { TaskList } from "./task-list";
import { DualProgress } from "@/components/shared/time-progress";
import { GanttChart } from "@/components/shared/gantt-chart";
import { TimelineSwitch } from "@/components/shared/timeline-switch";
import { PhasesManager, type PhaseView } from "./phases-manager";
import { ProjectPeople, type InvolvedPerson } from "./project-people";
import { listPhases } from "@/services/phases.service";
import { listContactsForSelect, listProjectContacts } from "@/services/contacts.service";
import { computeTimeline } from "@/lib/timeline";
import { isProjectClosed, projectProgress } from "@/lib/progress";
import { projectToFormDefaults } from "@/lib/project-defaults";
import { todayIso } from "@/lib/dates";
import { createProjectNote, removeProjectNote, setProjectRunning } from "./actions";
import { Plus } from "lucide-react";

const STATUS_TONE: Record<string, "success" | "warning" | "destructive" | "secondary"> = {
  completed: "success",
  in_progress: "warning",
  paused: "secondary",
  planned: "secondary",
  cancelled: "destructive",
};

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  const project = await getProjectById(user!.id, id);

  if (!project) notFound();

  const [financials, notes, tasks, clients, documents, phases, involved, contactChoices] = await Promise.all([
    getProjectFinancials(id),
    listProjectNotes(user!.id, id),
    listTasksByProject(user!.id, id),
    listActiveClientsForSelect(user!.id),
    listDocumentsByProject(user!.id, id),
    listPhases(user!.id, id),
    listProjectContacts(user!.id, id),
    listContactsForSelect(user!.id),
  ]);

  const today = todayIso();
  const timeline = computeTimeline({ ...project, legacy_end: project.expected_end_date }, today);
  const progress = projectProgress(phases, tasks);
  const projectProfit = financials.profit ?? 0;
  // chiuso = stato completato/annullato OPPURE tutte le macro attività completate
  const closed = isProjectClosed(project.status, progress);
  const done = project.status === "completed" || progress.allDone;

  const phaseViews: PhaseView[] = phases.map((ph) => {
    const tl = computeTimeline({ ...ph, legacy_end: null }, today);
    return {
      id: ph.id,
      name: ph.name,
      startDate: ph.start_date,
      durationDays: ph.duration_days,
      completed: ph.completed,
      running: ph.timeline_running,
      end: tl.end as string,
      frozenTotal: tl.frozenTotal,
      late: tl.end != null && tl.end < today,
      parentId: ph.parent_id,
    };
  });

  const people: InvolvedPerson[] = involved
    .filter((row) => row.contacts)
    .map((row) => ({ id: row.id, role: row.role, contact: row.contacts as InvolvedPerson["contact"] }));

  return (
    <div className="space-y-6 px-4 py-6 md:px-6 md:py-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold text-foreground">{project.name}</h1>
            {project.archived_at && <Badge variant="secondary">Archiviato</Badge>}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>{(project.clients as { name: string } | null)?.name ?? "—"}</span>
            <Badge variant={STATUS_TONE[project.status] ?? "secondary"}>
              {PROJECT_STATUS[project.status as keyof typeof PROJECT_STATUS] ?? project.status}
            </Badge>
            <Badge variant="outline">{PRIORITY[project.priority as keyof typeof PRIORITY] ?? project.priority}</Badge>
            {timeline.end && <span>Scadenza: {formatDate(timeline.end)}</span>}
          </div>
        </div>
        <ProjectFormDialog
          clients={clients}
          project={projectToFormDefaults(project)}
          legacyEnd={project.duration_days == null ? project.expected_end_date : null}
          trigger={
            <Button variant="outline">
              <Pencil />
              Modifica
            </Button>
          }
        />
      </div>

      {project.description && <p className="text-sm text-muted-foreground">{project.description}</p>}

      {Object.keys((project.custom_fields as Record<string, string>) ?? {}).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-normal text-muted-foreground">Campi personalizzati</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(project.custom_fields as Record<string, string>).map(([label, value]) => (
              <div key={label}>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-sm font-medium">{value || "—"}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-medium">Avanzamento</p>
            {!closed && timeline.hasDuration && (
              <TimelineSwitch running={project.timeline_running} action={setProjectRunning.bind(null, id)} />
            )}
          </div>
          <DualProgress
            timeline={timeline}
            progressPercent={progress.percent}
            progressLabel={progress.label}
            completed={done}
          />
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-normal text-muted-foreground">Valore progetto</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="tabular text-xl font-semibold">{formatCurrency(project.project_value)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-normal text-muted-foreground">Costi sostenuti</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="tabular text-xl font-semibold text-destructive">{formatCurrency(financials.costs_incurred ?? 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-normal text-muted-foreground">Profitto</CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={`tabular text-xl font-semibold ${projectProfit >= 0 ? "text-success" : "text-destructive"}`}
            >
              {formatCurrency(projectProfit)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Gantt, macro e micro attività</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <GanttChart phases={phases} />
          <PhasesManager projectId={id} phases={phaseViews} />
        </CardContent>
      </Card>

      <Tabs defaultValue="task">
        <TabsList>
          <TabsTrigger value="task">Task ({tasks.length})</TabsTrigger>
          <TabsTrigger value="persone">Persone ({people.length})</TabsTrigger>
          <TabsTrigger value="documenti">Documenti ({documents.length})</TabsTrigger>
          <TabsTrigger value="note">Note ({notes.length})</TabsTrigger>
        </TabsList>
        <Card className="mt-3">
          <CardContent className="pt-6">
            <TabsContent value="task">
              <TaskList tasks={tasks} />
            </TabsContent>
            <TabsContent value="persone">
              <ProjectPeople projectId={id} people={people} available={contactChoices} />
            </TabsContent>
            <TabsContent value="documenti" className="space-y-3">
              <div className="flex justify-end">
                <DocumentUploadDialog
                  link={{ projectId: id }}
                  trigger={
                    <Button size="sm">
                      <Plus />
                      Carica documento
                    </Button>
                  }
                />
              </div>
              <DocumentList documents={documents} />
            </TabsContent>
            <TabsContent value="note">
              <NotesTab
                notes={notes}
                onAdd={createProjectNote.bind(null, id)}
                onRemove={removeProjectNote.bind(null, id)}
              />
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
}
