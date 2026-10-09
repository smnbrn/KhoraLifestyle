import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import { computeTimeline } from "@/lib/timeline";
import { todayIso } from "@/lib/dates";
import { TimelineSwitch } from "@/components/shared/timeline-switch";
import { timeStatusText } from "@/components/shared/time-progress";
import { PRIORITY } from "@/lib/constants";
import { QuickStatusSelect } from "./quick-status-select";
import { TaskRowActions } from "./task-row-actions";
import { setTaskRunning } from "./actions";
import type { TaskListItem } from "@/services/tasks.service";

const PRIORITY_TONE: Record<string, "success" | "warning" | "destructive" | "secondary"> = {
  urgent: "destructive",
  high: "warning",
  medium: "secondary",
  low: "secondary",
};

export function TasksTable({
  tasks,
  clients,
  projects,
}: {
  tasks: TaskListItem[];
  clients: { id: string; name: string }[];
  projects: { id: string; name: string }[];
}) {
  const today = todayIso();

  if (tasks.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
        Nessun task trovato.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Titolo</TableHead>
          <TableHead className="hidden sm:table-cell">Progetto / Cliente</TableHead>
          <TableHead className="hidden md:table-cell">Priorità</TableHead>
          <TableHead className="hidden lg:table-cell">Scadenza</TableHead>
          <TableHead className="hidden xl:table-cell">Tempo</TableHead>
          <TableHead>Stato</TableHead>
          <TableHead className="w-10" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {tasks.map((task) => {
          const tl = computeTimeline({ ...task, legacy_end: task.due_date }, today);
          const done = task.status === "completed";
          const overdue = !done && tl.end != null && tl.end < today;
          return (
            <TableRow key={task.id}>
              <TableCell className="font-medium">{task.title}</TableCell>
              <TableCell className="hidden text-muted-foreground sm:table-cell">
                {task.projects?.name ?? task.clients?.name ?? "—"}
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <Badge variant={PRIORITY_TONE[task.priority] ?? "secondary"}>
                  {PRIORITY[task.priority as keyof typeof PRIORITY] ?? task.priority}
                </Badge>
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                {tl.end ? (
                  <div>
                    <span className={overdue ? "font-medium text-destructive" : ""}>{formatDate(tl.end)}</span>
                    <p className="text-xs text-muted-foreground">{timeStatusText(tl, done)}</p>
                  </div>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell className="hidden xl:table-cell">
                {tl.hasDuration && !done ? (
                  <div className="w-32 space-y-1">
                    <TimelineSwitch running={task.timeline_running} action={setTaskRunning.bind(null, task.id)} />
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={overdue ? "h-full bg-destructive" : "h-full bg-muted-foreground"}
                        style={{ width: `${tl.timePercent}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell>
                <QuickStatusSelect taskId={task.id} status={task.status} />
              </TableCell>
              <TableCell>
                <TaskRowActions task={task} clients={clients} projects={projects} />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
