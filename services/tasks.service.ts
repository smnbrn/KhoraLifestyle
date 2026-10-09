import "server-only";

import { createClient } from "@/lib/supabase/server";
import { computeTimeline } from "@/lib/timeline";
import type { Database } from "@/types/database.types";

type TaskInsert = Database["public"]["Tables"]["tasks"]["Insert"];
type TaskUpdate = Database["public"]["Tables"]["tasks"]["Update"];

const VALID_STATUSES = ["todo", "in_progress", "in_review", "completed"] as const;
const VALID_PRIORITIES = ["low", "medium", "high", "urgent"] as const;
type TaskStatus = (typeof VALID_STATUSES)[number];
type TaskPriority = (typeof VALID_PRIORITIES)[number];

function isValidStatus(v: string | undefined): v is TaskStatus {
  return !!v && (VALID_STATUSES as readonly string[]).includes(v);
}
function isValidPriority(v: string | undefined): v is TaskPriority {
  return !!v && (VALID_PRIORITIES as readonly string[]).includes(v);
}

function sanitizeForOrFilter(value: string) {
  return value.replace(/[,()]/g, " ").trim();
}

const TASK_LIST_COLUMNS =
  "id, title, description, status, priority, notes, project_id, client_id, due_date, start_date, duration_days, timeline_running, frozen_since, frozen_days, projects(name), clients(name)";

export async function listTasks(
  userId: string,
  options: {
    search?: string;
    status?: string;
    priority?: string;
    sort?: string;
    page?: number;
    pageSize?: number;
  } = {}
) {
  const supabase = await createClient();
  const { search, status, priority, sort, page = 1, pageSize = 15 } = options;

  let query = supabase.from("tasks").select(TASK_LIST_COLUMNS).eq("user_id", userId);

  if (isValidStatus(status)) query = query.eq("status", status);
  if (isValidPriority(priority)) query = query.eq("priority", priority);

  const term = search ? sanitizeForOrFilter(search) : "";
  if (term) query = query.ilike("title", `%${term}%`);

  // La scadenza è calcolata (inizio + giorni + giorni congelati), quindi non si
  // può ordinare in SQL: si prendono tutti i task che soddisfano i filtri, si
  // ordinano qui e si pagina qui. Per un gestionale personale il volume è piccolo.
  const { data } = await query.order("created_at", { ascending: false });
  const all = (data ?? []) as unknown as TaskListItem[];

  const endOf = (t: TaskListItem) => computeTimeline({ ...t, legacy_end: t.due_date }).end;

  let sorted = all;
  if (sort === "creazione") {
    sorted = all; // già per created_at desc
  } else if (sort === "priorita") {
    const rank: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
    sorted = [...all].sort(
      (a, b) =>
        (rank[a.priority] ?? 9) - (rank[b.priority] ?? 9) || (endOf(a) ?? "9999").localeCompare(endOf(b) ?? "9999")
    );
  } else {
    sorted = [...all].sort((a, b) => (endOf(a) ?? "9999").localeCompare(endOf(b) ?? "9999"));
  }

  const from = (page - 1) * pageSize;
  return { tasks: sorted.slice(from, from + pageSize), total: sorted.length, pageSize };
}

export async function getTaskTimelineState(userId: string, taskId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tasks")
    .select("duration_days, timeline_running, frozen_since, frozen_days")
    .eq("user_id", userId)
    .eq("id", taskId)
    .maybeSingle();
  return data;
}

export async function updateTaskStatus(userId: string, taskId: string, status: string) {
  if (!isValidStatus(status)) return { error: new Error("Stato non valido") };
  const supabase = await createClient();
  return supabase.from("tasks").update({ status }).eq("user_id", userId).eq("id", taskId);
}

export async function getTaskById(userId: string, taskId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("tasks").select("*").eq("user_id", userId).eq("id", taskId).single();
  return data;
}

export async function createTaskRecord(values: TaskInsert) {
  const supabase = await createClient();
  return supabase.from("tasks").insert(values).select().single();
}

export async function updateTaskRecord(userId: string, taskId: string, values: TaskUpdate) {
  const supabase = await createClient();
  return supabase.from("tasks").update(values).eq("user_id", userId).eq("id", taskId).select().single();
}

export async function deleteTaskRecord(userId: string, taskId: string) {
  const supabase = await createClient();
  return supabase.from("tasks").delete().eq("user_id", userId).eq("id", taskId);
}

export type TaskListItem = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  notes: string | null;
  project_id: string | null;
  client_id: string | null;
  due_date: string | null;
  start_date: string | null;
  duration_days: number | null;
  timeline_running: boolean;
  frozen_since: string | null;
  frozen_days: number;
  projects: { name: string } | null;
  clients: { name: string } | null;
};
