"use server";

import { revalidatePath } from "next/cache";

import { phaseSchema } from "@/schemas/phase.schema";
import { getCurrentUser } from "@/services/auth.service";
import {
  createPhase,
  deletePhase,
  getPhaseParentCheck,
  setPhaseCompleted,
  setPhaseRunning,
  syncProjectCompletion,
  updatePhase,
} from "@/services/phases.service";
import type { ActionResult } from "@/lib/action-result";

function refresh(projectId: string) {
  revalidatePath(`/progetti/${projectId}`);
  revalidatePath("/progetti");
  revalidatePath("/lavoro");
  revalidatePath("/dashboard");
  revalidatePath("/calendario");
}

/**
 * Crea o modifica una macro attività. Con `parentId` crea una micro attività
 * dentro quella macro (una micro non può contenere altre micro).
 */
export async function savePhase(
  projectId: string,
  phaseId: string | null,
  input: unknown,
  parentId: string | null = null
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Sessione scaduta. Accedi di nuovo." };

  const parsed = phaseSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const values = {
    name: parsed.data.name.trim(),
    start_date: parsed.data.startDate,
    duration_days: Number(parsed.data.durationDays),
  };

  if (parentId && !phaseId) {
    const ok = await getPhaseParentCheck(user.id, projectId, parentId);
    if (!ok) return { success: false, error: "La macro attività scelta non esiste." };
  }

  const { error } = phaseId
    ? await updatePhase(user.id, phaseId, values)
    : await createPhase({ ...values, user_id: user.id, project_id: projectId, parent_id: parentId });
  if (error) return { success: false, error: "Salvataggio non riuscito. Riprova." };

  await syncProjectCompletion(user.id, projectId);
  refresh(projectId);
  return { success: true, data: undefined };
}

export async function togglePhaseCompleted(projectId: string, phaseId: string, completed: boolean): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Sessione scaduta. Accedi di nuovo." };
  const { error } = await setPhaseCompleted(user.id, phaseId, completed);
  if (error) return { success: false, error: "Aggiornamento non riuscito." };
  await syncProjectCompletion(user.id, projectId);
  refresh(projectId);
  return { success: true, data: undefined };
}

export async function togglePhaseRunning(projectId: string, phaseId: string, running: boolean): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Sessione scaduta. Accedi di nuovo." };
  const { error } = await setPhaseRunning(user.id, phaseId, running);
  if (error) return { success: false, error: "Aggiornamento non riuscito." };
  refresh(projectId);
  return { success: true, data: undefined };
}

export async function removePhase(projectId: string, phaseId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Sessione scaduta. Accedi di nuovo." };
  const { error } = await deletePhase(user.id, phaseId);
  if (error) return { success: false, error: "Eliminazione non riuscita." };
  await syncProjectCompletion(user.id, projectId);
  refresh(projectId);
  return { success: true, data: undefined };
}
