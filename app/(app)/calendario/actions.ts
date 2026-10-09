"use server";

import { revalidatePath } from "next/cache";

import { eventSchema } from "@/schemas/event.schema";
import { getCurrentUser } from "@/services/auth.service";
import { createEvent, deleteEvent } from "@/services/calendar.service";
import type { ActionResult } from "@/lib/action-result";

export async function saveEvent(formData: FormData): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Sessione scaduta. Accedi di nuovo." };

  const parsed = eventSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    eventDate: formData.get("eventDate"),
    eventTime: formData.get("eventTime") || undefined,
    eventType: formData.get("eventType"),
    clientId: formData.get("clientId") || undefined,
    projectId: formData.get("projectId") || undefined,
    taskId: formData.get("taskId") || undefined,
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { error } = await createEvent({
    user_id: user.id,
    title: parsed.data.title,
    description: parsed.data.description || null,
    event_date: parsed.data.eventDate,
    event_time: parsed.data.eventTime || null,
    event_type: parsed.data.eventType,
    client_id: parsed.data.clientId || null,
    project_id: parsed.data.projectId || null,
    task_id: parsed.data.taskId || null,
  });

  if (error) return { success: false, error: "Salvataggio non riuscito." };

  revalidatePath("/calendario");
  return { success: true, data: undefined };
}

export async function removeEvent(eventId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Sessione scaduta. Accedi di nuovo." };

  const { error } = await deleteEvent(user.id, eventId);
  if (error) return { success: false, error: "Eliminazione non riuscita." };

  revalidatePath("/calendario");
  return { success: true, data: undefined };
}
