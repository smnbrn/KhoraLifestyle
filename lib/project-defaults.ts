import { toPriority, toProjectStatus } from "@/lib/enum-guards";
import { customFieldsToArray, type ProjectInput } from "@/schemas/project.schema";

type ProjectLike = {
  id: string;
  client_id: string;
  name: string;
  description: string | null;
  status: string;
  priority: string;
  start_date: string | null;
  actual_end_date: string | null;
  budget: number | null;
  project_value: number;
  notes: string | null;
  duration_days: number | null;
  timeline_running: boolean;
  custom_fields: unknown;
};

/** Valori iniziali completi del form progetto (mai parziali: altrimenti salvando si azzererebbero i campi mancanti). */
export function projectToFormDefaults(p: ProjectLike): Partial<ProjectInput> & { id: string } {
  return {
    id: p.id,
    clientId: p.client_id,
    name: p.name,
    description: p.description ?? undefined,
    status: toProjectStatus(p.status),
    priority: toPriority(p.priority),
    startDate: p.start_date ?? undefined,
    durationDays: p.duration_days != null ? String(p.duration_days) : undefined,
    timelineRunning: p.timeline_running,
    actualEndDate: p.actual_end_date ?? undefined,
    budget: p.budget != null ? String(p.budget) : undefined,
    projectValue: String(p.project_value),
    notes: p.notes ?? undefined,
    customFields: customFieldsToArray(p.custom_fields),
  };
}
