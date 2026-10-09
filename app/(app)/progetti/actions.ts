"use server";

import { revalidatePath } from "next/cache";

import { projectSchema } from "@/schemas/project.schema";
import { buildTimelineValues } from "@/lib/timeline-input";
import { getCurrentUser } from "@/services/auth.service";
import {
  createProjectRecord,
  getProjectTimelineState,
  updateProjectRecord,
  archiveProject,
  deleteProjectRecord,
} from "@/services/projects.service";
import type { ActionResult } from "@/lib/action-result";

function toNumberOrNull(value: string | undefined) {
  if (!value) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function toDateOrNull(value: string | undefined) {
  return value && value.trim() !== "" ? value : null;
}

function toCustomFieldsObject(fields: { label: string; value?: string }[] | undefined) {
  const obj: Record<string, string> = {};
  for (const f of fields ?? []) {
    const label = f.label.trim();
    if (label) obj[label] = f.value?.trim() ?? "";
  }
  return obj;
}

export async function saveProject(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Sessione scaduta. Accedi di nuovo." };

  const customFieldsRaw = formData.get("customFieldsJson");

  const parsed = projectSchema.safeParse({
    clientId: formData.get("clientId"),
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    status: formData.get("status"),
    priority: formData.get("priority"),
    startDate: formData.get("startDate") || undefined,
    durationDays: formData.get("durationDays") || undefined,
    timelineRunning: formData.get("timelineRunning") !== "false",
    actualEndDate: formData.get("actualEndDate") || undefined,
    budget: formData.get("budget") || undefined,
    projectValue: formData.get("projectValue") || undefined,
    notes: formData.get("notes") || undefined,
    customFields: customFieldsRaw ? JSON.parse(String(customFieldsRaw)) : [],
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const projectId = formData.get("id") as string | null;

  const existing = projectId ? await getProjectTimelineState(user.id, projectId) : null;
  const timeline = buildTimelineValues(parsed.data, existing);
  if ("error" in timeline) return { success: false, error: timeline.error };

  const values = {
    client_id: parsed.data.clientId,
    name: parsed.data.name,
    description: parsed.data.description || null,
    status: parsed.data.status,
    priority: parsed.data.priority,
    ...timeline.values,
    // istantanea della scadenza calcolata (la fonte di verità resta il calcolo a giorni)
    ...(timeline.end
      ? { expected_end_date: timeline.end }
      : timeline.clearedDuration
        ? { expected_end_date: null }
        : {}),
    actual_end_date: toDateOrNull(parsed.data.actualEndDate),
    budget: toNumberOrNull(parsed.data.budget),
    project_value: toNumberOrNull(parsed.data.projectValue) ?? 0,
    notes: parsed.data.notes || null,
    custom_fields: toCustomFieldsObject(parsed.data.customFields),
  };

  const { data, error } = projectId
    ? await updateProjectRecord(user.id, projectId, values)
    : await createProjectRecord({ ...values, user_id: user.id });

  if (error || !data) {
    return { success: false, error: "Salvataggio non riuscito. Riprova." };
  }

  revalidatePath("/progetti");
  revalidatePath(`/progetti/${data.id}`);
  revalidatePath("/dashboard");
  revalidatePath("/lavoro");
  revalidatePath("/calendario");
  return { success: true, data: { id: data.id } };
}

export async function toggleArchiveProject(projectId: string, archived: boolean): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Sessione scaduta. Accedi di nuovo." };

  const { error } = await archiveProject(user.id, projectId, archived);
  if (error) return { success: false, error: "Operazione non riuscita." };

  revalidatePath("/progetti");
  revalidatePath(`/progetti/${projectId}`);
  return { success: true, data: undefined };
}

export async function deleteProject(projectId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Sessione scaduta. Accedi di nuovo." };

  const { error } = await deleteProjectRecord(user.id, projectId);
  if (error) {
    return {
      success: false,
      error: "Impossibile eliminare: il progetto ha task, preventivi o fatture collegati. Archivialo invece.",
    };
  }

  revalidatePath("/progetti");
  return { success: true, data: undefined };
}
