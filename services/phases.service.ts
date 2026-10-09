import "server-only";

import { createClient } from "@/lib/supabase/server";
import { toggleTimeline } from "@/lib/timeline";
import { todayIso } from "@/lib/dates";
import type { Database } from "@/types/database.types";

type PhaseInsert = Database["public"]["Tables"]["project_phases"]["Insert"];
type PhaseUpdate = Database["public"]["Tables"]["project_phases"]["Update"];

export type PhaseRow = Database["public"]["Tables"]["project_phases"]["Row"];

export async function listPhases(userId: string, projectId: string): Promise<PhaseRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("project_phases")
    .select("*")
    .eq("user_id", userId)
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true })
    .order("start_date", { ascending: true });
  return data ?? [];
}

/** Tutte le macro attività non completate (per calendario / notifiche / dashboard). */
export async function listOpenPhases(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("project_phases")
    .select("*, projects(id, name, archived_at, status)")
    .eq("user_id", userId)
    .eq("completed", false);
  return (data ?? []).filter(
    (p) => p.projects && !p.projects.archived_at && !["completed", "cancelled"].includes(p.projects.status)
  );
}

export async function createPhase(values: PhaseInsert) {
  const supabase = await createClient();
  return supabase.from("project_phases").insert(values).select().single();
}

export async function updatePhase(userId: string, phaseId: string, values: PhaseUpdate) {
  const supabase = await createClient();
  return supabase.from("project_phases").update(values).eq("user_id", userId).eq("id", phaseId).select().single();
}

export async function deletePhase(userId: string, phaseId: string) {
  const supabase = await createClient();
  return supabase.from("project_phases").delete().eq("user_id", userId).eq("id", phaseId);
}

export async function setPhaseCompleted(userId: string, phaseId: string, completed: boolean) {
  return updatePhase(userId, phaseId, {
    completed,
    completed_at: completed ? new Date().toISOString() : null,
  });
}

/** Sposta l'interruttore scorre/congelato leggendo prima lo stato reale dal DB. */
export async function setPhaseRunning(userId: string, phaseId: string, running: boolean) {
  const supabase = await createClient();
  const { data: phase, error } = await supabase
    .from("project_phases")
    .select("timeline_running, frozen_since, frozen_days")
    .eq("user_id", userId)
    .eq("id", phaseId)
    .single();
  if (error || !phase) return { data: null, error: error ?? new Error("Macro attività non trovata") };
  return updatePhase(userId, phaseId, toggleTimeline(phase, running, todayIso()));
}
