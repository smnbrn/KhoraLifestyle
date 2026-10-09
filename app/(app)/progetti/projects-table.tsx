import Link from "next/link";
import { ListPlus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";
import { computeTimeline } from "@/lib/timeline";
import { todayIso } from "@/lib/dates";
import { DualProgress, timeStatusText } from "@/components/shared/time-progress";
import { PROJECT_STATUS, PRIORITY } from "@/lib/constants";
import { ProjectRowActions } from "./project-row-actions";
import type { ProjectListItem } from "@/services/projects.service";

function hasCustomFields(value: unknown): boolean {
  return !!value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).length > 0;
}

const STATUS_TONE: Record<string, "success" | "warning" | "destructive" | "secondary"> = {
  completed: "success",
  in_progress: "warning",
  paused: "secondary",
  planned: "secondary",
  cancelled: "destructive",
};

export function ProjectsTable({
  projects,
  clients,
  progress,
}: {
  projects: ProjectListItem[];
  clients: { id: string; name: string }[];
  progress: Record<string, { percent: number; label: string }>;
}) {
  const today = todayIso();

  if (projects.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
        Nessun progetto trovato.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Progetto</TableHead>
          <TableHead className="hidden sm:table-cell">Cliente</TableHead>
          <TableHead>Stato</TableHead>
          <TableHead className="hidden md:table-cell">Priorità</TableHead>
          <TableHead className="hidden lg:table-cell">Scadenza</TableHead>
          <TableHead className="hidden w-56 xl:table-cell">Tempo / Progresso</TableHead>
          <TableHead className="text-right">Valore</TableHead>
          <TableHead className="w-10" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {projects.map((project) => {
          const tl = computeTimeline({ ...project, legacy_end: project.expected_end_date }, today);
          const closed = project.status === "completed" || project.status === "cancelled";
          const pr = progress[project.id]?.percent ?? 0;
          return (
          <TableRow key={project.id}>
            <TableCell className="font-medium">
              <Link href={`/progetti/${project.id}`} className="hover:underline">
                {project.name}
              </Link>
              {project.archived_at && (
                <Badge variant="secondary" className="ml-2">
                  Archiviato
                </Badge>
              )}
              {hasCustomFields(project.custom_fields) && (
                <ListPlus
                  className="ml-2 inline size-3.5 text-muted-foreground"
                  aria-label="Ha campi personalizzati"
                />
              )}
            </TableCell>
            <TableCell className="hidden text-muted-foreground sm:table-cell">
              {project.clients?.name ?? "—"}
            </TableCell>
            <TableCell>
              <Badge variant={STATUS_TONE[project.status] ?? "secondary"}>
                {PROJECT_STATUS[project.status as keyof typeof PROJECT_STATUS] ?? project.status}
              </Badge>
            </TableCell>
            <TableCell className="hidden text-muted-foreground md:table-cell">
              {PRIORITY[project.priority as keyof typeof PRIORITY] ?? project.priority}
            </TableCell>
            <TableCell className="hidden lg:table-cell">
              {tl.end ? (
                <div>
                  <span className={!closed && tl.end < today ? "font-medium text-destructive" : "text-muted-foreground"}>
                    {formatDate(tl.end)}
                  </span>
                  <p className="text-xs text-muted-foreground">{timeStatusText(tl, project.status === "completed")}</p>
                </div>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </TableCell>
            <TableCell className="hidden xl:table-cell">
              {tl.end && !closed ? (
                <DualProgress timeline={tl} progressPercent={pr} compact />
              ) : (
                <span className="text-xs text-muted-foreground">{closed ? "—" : `${pr}% completato`}</span>
              )}
            </TableCell>
            <TableCell className="tabular text-right">{formatCurrency(project.project_value)}</TableCell>
            <TableCell>
              <ProjectRowActions project={project} clients={clients} />
            </TableCell>
          </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
