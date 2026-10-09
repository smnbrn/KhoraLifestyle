import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TableSearchInput } from "@/components/shared/table-search-input";
import { TablePagination } from "@/components/shared/table-pagination";
import { StatusFilter } from "@/components/shared/status-filter";
import { SortSelect } from "@/components/shared/sort-select";
import { TASK_STATUS } from "@/lib/constants";
import { getCurrentUser } from "@/services/auth.service";
import { listTasks } from "@/services/tasks.service";
import { listActiveClientsForSelect, listActiveProjectsForSelect } from "@/services/projects.service";
import { TasksTable } from "./tasks-table";
import { TaskFormDialog } from "./task-form-dialog";

const SORT_OPTIONS = { scadenza: "Per scadenza", priorita: "Per priorità", creazione: "Più recenti" };

export default async function TaskPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; stato?: string; ordina?: string }>;
}) {
  const params = await searchParams;
  const user = await getCurrentUser();
  const page = Number(params.page) || 1;

  const [{ tasks, total, pageSize }, clients, projects] = await Promise.all([
    listTasks(user!.id, { search: params.q, status: params.stato, sort: params.ordina, page }),
    listActiveClientsForSelect(user!.id),
    listActiveProjectsForSelect(user!.id),
  ]);

  return (
    <div className="space-y-6 px-4 py-6 md:px-6 md:py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Task</h1>
          <p className="text-sm text-muted-foreground">{total} task</p>
        </div>
        <TaskFormDialog
          clients={clients}
          projects={projects}
          trigger={
            <Button>
              <Plus />
              Nuovo task
            </Button>
          }
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <TableSearchInput placeholder="Cerca per titolo…" />
        <StatusFilter options={TASK_STATUS} paramName="stato" placeholder="Tutti gli stati" />
        <SortSelect options={SORT_OPTIONS} paramName="ordina" />
      </div>

      <Card className="py-0">
        <TasksTable tasks={tasks} clients={clients} projects={projects} />
        <TablePagination page={page} pageSize={pageSize} total={total} basePath="/task" searchParams={params} />
      </Card>
    </div>
  );
}
