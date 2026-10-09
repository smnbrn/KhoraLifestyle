import Link from "next/link";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TableSearchInput } from "@/components/shared/table-search-input";
import { TablePagination } from "@/components/shared/table-pagination";
import { StatusFilter } from "@/components/shared/status-filter";
import { PROJECT_STATUS } from "@/lib/constants";
import { getCurrentUser } from "@/services/auth.service";
import { listProjects, listActiveClientsForSelect, getProjectsProgress } from "@/services/projects.service";
import { ProjectsTable } from "./projects-table";
import { ProjectFormDialog } from "./project-form-dialog";

export default async function ProgettiPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; archiviati?: string; stato?: string }>;
}) {
  const params = await searchParams;
  const user = await getCurrentUser();
  const page = Number(params.page) || 1;
  const showArchived = params.archiviati === "1";

  const [{ projects, total, pageSize }, clients] = await Promise.all([
    listProjects(user!.id, { search: params.q, status: params.stato, page, showArchived }),
    listActiveClientsForSelect(user!.id),
  ]);

  const progress = await getProjectsProgress(
    user!.id,
    projects.map((p) => p.id)
  );

  return (
    <div className="space-y-6 px-4 py-6 md:px-6 md:py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Progetti</h1>
          <p className="text-sm text-muted-foreground">
            {total} progetti {showArchived ? "archiviati" : "attivi"}
          </p>
        </div>
        <ProjectFormDialog
          clients={clients}
          trigger={
            <Button>
              <Plus />
              Nuovo progetto
            </Button>
          }
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <TableSearchInput placeholder="Cerca per nome progetto…" />
          <StatusFilter options={PROJECT_STATUS} paramName="stato" placeholder="Tutti gli stati" />
        </div>
        <Link
          href={showArchived ? "/progetti" : "/progetti?archiviati=1"}
          className="text-sm text-muted-foreground hover:text-foreground hover:underline"
        >
          {showArchived ? "Mostra progetti attivi" : "Mostra archiviati"}
        </Link>
      </div>

      <Card className="py-0">
        <ProjectsTable projects={projects} clients={clients} progress={progress} />
        <TablePagination page={page} pageSize={pageSize} total={total} basePath="/progetti" searchParams={params} />
      </Card>
    </div>
  );
}
