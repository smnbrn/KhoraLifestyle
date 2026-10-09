import "server-only";

import { createClient } from "@/lib/supabase/server";
import { projectProgress } from "@/lib/progress";
import type { Database } from "@/types/database.types";

type ProjectInsert = Database["public"]["Tables"]["projects"]["Insert"];
type ProjectUpdate = Database["public"]["Tables"]["projects"]["Update"];

function sanitizeForOrFilter(value: string) {
  return value.replace(/[,()]/g, " ").trim();
}

const PROJECT_LIST_COLUMNS =
  "id, client_id, name, description, status, priority, start_date, expected_end_date, actual_end_date, budget, notes, duration_days, timeline_running, frozen_since, frozen_days, project_value, archived_at, custom_fields, clients(name)";

const VALID_PROJECT_STATUSES = ["planned", "in_progress", "paused", "completed", "cancelled"] as const;
type ProjectStatus = (typeof VALID_PROJECT_STATUSES)[number];

function isValidProjectStatus(value: string | undefined): value is ProjectStatus {
  return !!value && (VALID_PROJECT_STATUSES as readonly string[]).includes(value);
}

export async function listProjects(
  userId: string,
  options: { search?: string; status?: string; page?: number; pageSize?: number; showArchived?: boolean } = {}
) {
  const supabase = await createClient();
  const { search, status, page = 1, pageSize = 15, showArchived = false } = options;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("projects")
    .select(PROJECT_LIST_COLUMNS, {
      count: "exact",
    })
    .eq("user_id", userId);

  query = showArchived ? query.not("archived_at", "is", null) : query.is("archived_at", null);
  // Il valore arriva da un parametro URL: se non è uno stato valido (utente
  // che ha modificato l'URL a mano), il filtro viene ignorato invece di
  // rompere la query.
  if (isValidProjectStatus(status)) query = query.eq("status", status);

  const term = search ? sanitizeForOrFilter(search) : "";
  if (term) query = query.ilike("name", `%${term}%`);

  const { data, count } = await query.order("created_at", { ascending: false }).range(from, to);

  return { projects: data ?? [], total: count ?? 0, pageSize };
}

export async function listActiveClientsForSelect(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("clients")
    .select("id, name")
    .eq("user_id", userId)
    .is("archived_at", null)
    .order("name", { ascending: true });
  return data ?? [];
}

export async function listActiveProjectsForSelect(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select("id, name")
    .eq("user_id", userId)
    .is("archived_at", null)
    .order("name", { ascending: true });
  return data ?? [];
}

export async function getProjectById(userId: string, projectId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select("*, clients(id, name)")
    .eq("user_id", userId)
    .eq("id", projectId)
    .single();
  return data;
}

export async function getProjectFinancials(projectId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("project_financials").select("*").eq("project_id", projectId).maybeSingle();
  return data ?? { costs_incurred: 0, profit: 0 };
}

export async function createProjectRecord(values: ProjectInsert) {
  const supabase = await createClient();
  return supabase.from("projects").insert(values).select().single();
}

export async function updateProjectRecord(userId: string, projectId: string, values: ProjectUpdate) {
  const supabase = await createClient();
  return supabase.from("projects").update(values).eq("user_id", userId).eq("id", projectId).select().single();
}

export async function archiveProject(userId: string, projectId: string, archived: boolean) {
  const supabase = await createClient();
  return supabase
    .from("projects")
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq("user_id", userId)
    .eq("id", projectId);
}

export async function deleteProjectRecord(userId: string, projectId: string) {
  const supabase = await createClient();
  return supabase.from("projects").delete().eq("user_id", userId).eq("id", projectId);
}

export type ProjectListItem = {
  id: string;
  client_id: string;
  name: string;
  description: string | null;
  status: string;
  priority: string;
  start_date: string | null;
  expected_end_date: string | null;
  actual_end_date: string | null;
  budget: number | null;
  notes: string | null;
  duration_days: number | null;
  timeline_running: boolean;
  frozen_since: string | null;
  frozen_days: number;
  project_value: number;
  archived_at: string | null;
  custom_fields: unknown;
  clients: { name: string } | null;
};

export async function getProjectTimelineState(userId: string, projectId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select("duration_days, timeline_running, frozen_since, frozen_days")
    .eq("user_id", userId)
    .eq("id", projectId)
    .maybeSingle();
  return data;
}

/** Progetti aperti (non archiviati/chiusi) con i campi del tempo, per dashboard e Gantt d'insieme. */
export async function listOpenProjects(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select(PROJECT_LIST_COLUMNS)
    .eq("user_id", userId)
    .is("archived_at", null)
    .in("status", ["planned", "in_progress", "paused"])
    .order("created_at", { ascending: false });
  return (data ?? []) as unknown as ProjectListItem[];
}

/** Progresso reale per un gruppo di progetti (macro attività pesate per durata, altrimenti task). */
export async function getProjectsProgress(userId: string, projectIds: string[]) {
  const result: Record<string, { percent: number; label: string }> = {};
  if (projectIds.length === 0) return result;

  const supabase = await createClient();
  const [phasesRes, tasksRes] = await Promise.all([
    supabase
      .from("project_phases")
      .select("project_id, completed, duration_days")
      .eq("user_id", userId)
      .in("project_id", projectIds),
    supabase.from("tasks").select("project_id, status").eq("user_id", userId).in("project_id", projectIds),
  ]);

  for (const id of projectIds) {
    const phases = (phasesRes.data ?? []).filter((p) => p.project_id === id);
    const tasks = (tasksRes.data ?? []).filter((t) => t.project_id === id);
    const { percent, label } = projectProgress(phases, tasks);
    result[id] = { percent, label };
  }
  return result;
}
