"use server";

import { revalidatePath } from "next/cache";

import { phaseSchema } from "@/schemas/phase.schema";
import { getCurrentUser } from "@/services/auth.service";
import { createPhase, deletePhase, setPhaseCompleted, setPhaseRunning, updatePhase } from "@/services/phases.service";
import type { ActionResult } from "@/lib/action-result";

function refresh(projectId: string) {
  revalidatePath(`/progetti/${projectId}`);
  revalidatePath("/progetti");
  revalidatePath("/lavoro");
  revalidatePath("/dashboard");
  revalidatePath("/calendario");
}

export async function savePhase(projectId: string, phaseId: string | null, input: unknown): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Sessione scaduta. Accedi di nuovo." };

  const parsed = phaseSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const values = {
    name: parsed.data.name.trim(),
    start_date: parsed.data.startDate,
    duration_days: Number(parsed.data.durationDays),
  };

  const { error } = phaseId
    ? await updatePhase(user.id, phaseId, values)
    : await createPhase({ ...values, user_id: user.id, project_id: projectId });
  if (error) return { success: false, error: "Salvataggio non riuscito. Riprova." };

  refresh(projectId);
  return { success: true, data: undefined };
}

export async function togglePhaseCompleted(projectId: string, phaseId: string, completed: boolean): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Sessione scaduta. Accedi di nuovo." };
  const { error } = await setPhaseCompleted(user.id, phaseId, completed);
  if (error) return { success: false, error: "Aggiornamento non riuscito." };
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
  refresh(projectId);
  return { success: true, data: undefined };
}
