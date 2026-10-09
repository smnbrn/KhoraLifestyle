import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { computeTimeline } from "@/lib/timeline";
import { TASK_STATUS, PRIORITY } from "@/lib/constants";

const STATUS_TONE: Record<string, "success" | "warning" | "destructive" | "secondary"> = {
  completed: "success",
  in_review: "warning",
  in_progress: "secondary",
  todo: "secondary",
};

type Task = {
  id: string;
  title: string;
  status: string;
  priority: string;
  due_date: string | null;
  start_date: string | null;
  duration_days: number | null;
  timeline_running: boolean;
  frozen_since: string | null;
  frozen_days: number;
};

export function TaskList({ tasks }: { tasks: Task[] }) {
  if (tasks.length === 0) {
    return <p className="text-sm text-muted-foreground">Nessun task collegato a questo progetto.</p>;
  }

  return (
    <ul className="space-y-2">
      {tasks.map((task) => {
        const end = computeTimeline({ ...task, legacy_end: task.due_date }).end;
        return (
        <li key={task.id} className="flex items-center justify-between gap-3 rounded-md border p-3 text-sm">
          <div className="min-w-0">
            <p className="truncate font-medium">{task.title}</p>
            {end && <p className="text-xs text-muted-foreground">{formatDate(end)}</p>}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Badge variant="outline">{PRIORITY[task.priority as keyof typeof PRIORITY] ?? task.priority}</Badge>
            <Badge variant={STATUS_TONE[task.status] ?? "secondary"}>
              {TASK_STATUS[task.status as keyof typeof TASK_STATUS] ?? task.status}
            </Badge>
          </div>
        </li>
        );
      })}
    </ul>
  );
}
