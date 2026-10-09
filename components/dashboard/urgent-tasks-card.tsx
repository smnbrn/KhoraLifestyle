import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { PRIORITY } from "@/lib/constants";

type Task = { id: string; title: string; priority: string; due_date: string | null };

export function UrgentTasksCard({ tasks }: { tasks: Task[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Task urgenti</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {tasks.length === 0 && <p className="text-sm text-muted-foreground">Nessun task urgente al momento.</p>}
        {tasks.map((task) => (
          <div key={task.id} className="flex items-center justify-between gap-3">
            <p className="min-w-0 truncate text-sm">{task.title}</p>
            <div className="flex shrink-0 items-center gap-2">
              {task.due_date && <span className="text-xs text-muted-foreground">{formatDate(task.due_date)}</span>}
              <Badge variant={task.priority === "urgent" ? "destructive" : "warning"}>
                {PRIORITY[task.priority as keyof typeof PRIORITY] ?? task.priority}
              </Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
