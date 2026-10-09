"use server";

import { revalidatePath } from "next/cache";

import { taskSchema } from "@/schemas/task.schema";
import { getCurrentUser } from "@/services/auth.service";
import {
  createTaskRecord,
  updateTaskRecord,
  updateTaskStatus,
  deleteTaskRecord,
  getTaskTimelineState,
} from "@/services/tasks.service";
import { buildTimelineValues } from "@/lib/timeline-input";
import { computeTimeline, toggleTimeline } from "@/lib/timeline";
import { todayIso } from "@/lib/dates";
import type { ActionResult } from "@/lib/action-result";

export async function saveTask(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Sessione scaduta. Accedi di nuovo." };

  const parsed = taskSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    projectId: formData.get("projectId") || undefined,
    clientId: formData.get("clientId") || undefined,
    status: formData.get("status"),
    priority: formData.get("priority"),
    startDate: formData.get("startDate") || undefined,
    durationDays: formData.get("durationDays") || undefined,
    timelineRunning: formData.get("timelineRunning") !== "false",
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const taskId = formData.get("id") as string | null;

  const existing = taskId ? await getTaskTimelineState(user.id, taskId) : null;
  const timeline = buildTimelineValues(parsed.data, existing, todayIso(), { zeroDaysIfStartOnly: true });
  if ("error" in timeline) return { success: false, error: timeline.error };

  const values = {
    title: parsed.data.title,
    description: parsed.data.description || null,
    project_id: parsed.data.projectId || null,
    client_id: parsed.data.clientId || null,
    status: parsed.data.status,
    priority: parsed.data.priority,
    ...timeline.values,
    // istantanea della scadenza calcolata (la fonte di verità resta il calcolo a giorni)
    ...(timeline.end ? { due_date: timeline.end } : timeline.clearedDuration ? { due_date: null } : {}),
    notes: parsed.data.notes || null,
  };

  const { data, error } = taskId
    ? await updateTaskRecord(user.id, taskId, values)
    : await createTaskRecord({ ...values, user_id: user.id });

  if (error || !data) {
    return { success: false, error: "Salvataggio non riuscito. Riprova." };
  }

  revalidatePath("/task");
  revalidatePath("/dashboard");
  revalidatePath("/lavoro");
  revalidatePath("/calendario");
  return { success: true, data: { id: data.id } };
}

export async function changeTaskStatus(taskId: string, status: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Sessione scaduta. Accedi di nuovo." };

  const { error } = await updateTaskStatus(user.id, taskId, status);
  if (error) return { success: false, error: "Aggiornamento non riuscito." };

  revalidatePath("/task");
  revalidatePath("/dashboard");
  return { success: true, data: undefined };
}

export async function deleteTask(taskId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Sessione scaduta. Accedi di nuovo." };

  const { error } = await deleteTaskRecord(user.id, taskId);
  if (error) return { success: false, error: "Eliminazione non riuscita." };

  revalidatePath("/task");
  revalidatePath("/dashboard");
  return { success: true, data: undefined };
}

export async function setTaskRunning(taskId: string, running: boolean): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Sessione scaduta. Accedi di nuovo." };

  const state = await getTaskTimelineState(user.id, taskId);
  if (!state) return { success: false, error: "Task non trovato." };

  const today = todayIso();
  const { data, error } = await updateTaskRecord(user.id, taskId, toggleTimeline(state, running, today));
  if (error || !data) return { success: false, error: "Aggiornamento non riuscito." };

  if (data.start_date && data.duration_days != null) {
    const end = computeTimeline({ ...data, legacy_end: null }, today).end;
    if (end) await updateTaskRecord(user.id, taskId, { due_date: end });
  }

  revalidatePath("/task");
  revalidatePath("/dashboard");
  revalidatePath("/lavoro");
  revalidatePath("/calendario");
  return { success: true, data: undefined };
}
