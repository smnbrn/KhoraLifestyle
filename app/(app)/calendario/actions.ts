"use server";

import { revalidatePath } from "next/cache";

import { eventSchema } from "@/schemas/event.schema";
import { getCurrentUser } from "@/services/auth.service";
import { createEvent, deleteEvent, setEventDone } from "@/services/calendar.service";
import { deleteTaskRecord, updateTaskStatus } from "@/services/tasks.service";
import { deletePhaseById, setPhaseDoneById } from "@/services/phases.service";
import { deleteProjectRecord, updateProjectRecord } from "@/services/projects.service";
import { deleteDeadline, deleteTrip, markDeadlinePaid, reopenDeadline, updateTrip } from "@/services/life.service";
import { todayIso } from "@/lib/dates";
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

const ITEM_ID = /^(task|project|phase|rental-deadline|vehicle-deadline|trip|event)-(.+)$/;

function refreshAll() {
  for (const path of ["/calendario", "/dashboard", "/task", "/lavoro", "/progetti", "/vita", "/vita/affitti", "/vita/veicoli", "/vita/viaggi"]) {
    revalidatePath(path);
  }
}

/**
 * "Fatto" dal calendario: l'id è quello della voce del calendario (es. "task-<uuid>").
 * `done = false` la riapre. Vale per eventi, task, macro attività, progetti, scadenze (affitti/veicoli) e viaggi.
 */
export async function setCalendarItemDone(itemId: string, done: boolean): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Sessione scaduta. Accedi di nuovo." };
  const match = ITEM_ID.exec(itemId);
  if (!match) return { success: false, error: "Questa voce si gestisce dalla sua pagina." };
  const [, kind, id] = match;

  let error: unknown = null;
  switch (kind) {
    case "event":
      ({ error } = await setEventDone(user.id, id, done));
      break;
    case "task":
      ({ error } = await updateTaskStatus(user.id, id, done ? "completed" : "todo"));
      break;
    case "phase":
      ({ error } = await setPhaseDoneById(user.id, id, done));
      break;
    case "project":
      ({ error } = await updateProjectRecord(user.id, id, {
        status: done ? "completed" : "in_progress",
        actual_end_date: done ? todayIso() : null,
      }));
      break;
    case "trip":
      ({ error } = await updateTrip(user.id, id, { status: done ? "done" : "planned" }));
      break;
    case "rental-deadline":
    case "vehicle-deadline":
      // "Fatto" = pagata: una scadenza ricorrente riparte, una singola si chiude
      ({ error } = done ? await markDeadlinePaid(user.id, id) : await reopenDeadline(user.id, id));
      break;
  }

  if (error) return { success: false, error: "Aggiornamento non riuscito." };
  refreshAll();
  return { success: true, data: undefined };
}

/** Elimina dal calendario: eventi, task, macro attività, progetti, viaggi e scadenze (affitti/veicoli). */
export async function deleteCalendarItem(itemId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Sessione scaduta. Accedi di nuovo." };
  const match = ITEM_ID.exec(itemId);
  if (!match) return { success: false, error: "Questa voce si gestisce dalla sua pagina." };
  const [, kind, id] = match;

  let error: unknown = null;
  switch (kind) {
    case "event":
      ({ error } = await deleteEvent(user.id, id));
      break;
    case "task":
      ({ error } = await deleteTaskRecord(user.id, id));
      break;
    case "phase":
      ({ error } = await deletePhaseById(user.id, id));
      break;
    case "rental-deadline":
    case "vehicle-deadline":
      ({ error } = await deleteDeadline(user.id, id));
      break;
    case "trip":
      ({ error } = await deleteTrip(user.id, id));
      break;
    case "project":
      ({ error } = await deleteProjectRecord(user.id, id));
      if (error) {
        return {
          success: false,
          error: "Impossibile eliminare: il progetto ha task, preventivi o fatture collegati. Archivialo dalla sua pagina.",
        };
      }
      break;
    default:
      return { success: false, error: "Questa voce si elimina dalla sua pagina." };
  }

  if (error) return { success: false, error: "Eliminazione non riuscita." };
  refreshAll();
  return { success: true, data: undefined };
}
