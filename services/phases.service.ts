import "server-only";

import { createClient } from "@/lib/supabase/server";
import { toggleTimeline } from "@/lib/timeline";
import { todayIso } from "@/lib/dates";
import { updateProjectRecord } from "@/services/projects.service";
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

/**
 * Tutte le macro attività non completate (per notifiche / dashboard).
 * Con `includeCompleted` restituisce anche quelle completate (il calendario le tiene visibili).
 */
export async function listOpenPhases(userId: string, includeCompleted = false) {
  const supabase = await createClient();
  let query = supabase
    .from("project_phases")
    .select("*, projects(id, name, archived_at, status)")
    .eq("user_id", userId);
  if (!includeCompleted) query = query.eq("completed", false);
  const { data } = await query;
  const hidden = includeCompleted ? ["cancelled"] : ["completed", "cancelled"];
  return (data ?? []).filter((p) => p.projects && !p.projects.archived_at && !hidden.includes(p.projects.status));
}

/** Spunta / riapre una macro attività partendo solo dall'id (serve al calendario) e riallinea il progetto. */
export async function setPhaseDoneById(userId: string, phaseId: string, completed: boolean) {
  const supabase = await createClient();
  const { data: phase } = await supabase
    .from("project_phases")
    .select("project_id")
    .eq("user_id", userId)
    .eq("id", phaseId)
    .maybeSingle();
  if (!phase) return { error: new Error("Attività non trovata") };
  const { error } = await setPhaseCompleted(userId, phaseId, completed);
  if (error) return { error };
  await syncProjectCompletion(userId, phase.project_id);
  return { error: null };
}

export async function deletePhaseById(userId: string, phaseId: string) {
  const supabase = await createClient();
  const { data: phase } = await supabase
    .from("project_phases")
    .select("project_id")
    .eq("user_id", userId)
    .eq("id", phaseId)
    .maybeSingle();
  if (!phase) return { error: new Error("Attività non trovata") };
  const { error } = await deletePhase(userId, phaseId);
  if (error) return { error };
  await syncProjectCompletion(userId, phase.project_id);
  return { error: null };
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

/**
 * Tiene allineato lo stato del progetto con le sue macro attività (le micro non contano):
 *   - tutte completate  -> il progetto passa a "completato" (e si segna la fine effettiva)
 *   - ne riapro una     -> un progetto "completato" torna "in corso"
 * Così un progetto finito non resta "in corso" e non risulta più in ritardo.
 */
export async function syncProjectCompletion(userId: string, projectId: string) {
  const supabase = await createClient();
  const [{ data: phases }, { data: project }] = await Promise.all([
    supabase.from("project_phases").select("completed, parent_id").eq("user_id", userId).eq("project_id", projectId),
    supabase.from("projects").select("status, actual_end_date").eq("user_id", userId).eq("id", projectId).single(),
  ]);
  if (!project) return;
  const macros = (phases ?? []).filter((p) => !p.parent_id);
  if (macros.length === 0) return;

  const allDone = macros.every((p) => p.completed);
  if (allDone && ["planned", "in_progress", "paused"].includes(project.status)) {
    await updateProjectRecord(userId, projectId, {
      status: "completed",
      actual_end_date: project.actual_end_date ?? todayIso(),
    });
  } else if (!allDone && project.status === "completed") {
    await updateProjectRecord(userId, projectId, { status: "in_progress" });
  }
}

/** true se `parentId` è una macro attività (non una micro) di quel progetto. */
export async function getPhaseParentCheck(userId: string, projectId: string, parentId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("project_phases")
    .select("id")
    .eq("user_id", userId)
    .eq("project_id", projectId)
    .eq("id", parentId)
    .is("parent_id", null)
    .maybeSingle();
  return !!data;
}
