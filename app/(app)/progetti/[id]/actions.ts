"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/services/auth.service";
import { addProjectNote, deleteNote } from "@/services/notes.service";
import { getProjectTimelineState, updateProjectRecord } from "@/services/projects.service";
import { addContactToProject, removeContactFromProject } from "@/services/contacts.service";
import { computeTimeline, toggleTimeline } from "@/lib/timeline";
import { todayIso } from "@/lib/dates";
import type { ActionResult } from "@/lib/action-result";

export async function createProjectNote(projectId: string, content: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Sessione scaduta. Accedi di nuovo." };
  if (!content.trim()) return { success: false, error: "La nota non può essere vuota." };

  const { error } = await addProjectNote(user.id, projectId, content.trim());
  if (error) return { success: false, error: "Salvataggio non riuscito." };

  revalidatePath(`/progetti/${projectId}`);
  return { success: true, data: undefined };
}

export async function removeProjectNote(projectId: string, noteId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Sessione scaduta. Accedi di nuovo." };

  const { error } = await deleteNote(user.id, noteId);
  if (error) return { success: false, error: "Eliminazione non riuscita." };

  revalidatePath(`/progetti/${projectId}`);
  return { success: true, data: undefined };
}

export async function setProjectRunning(projectId: string, running: boolean): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Sessione scaduta. Accedi di nuovo." };

  const state = await getProjectTimelineState(user.id, projectId);
  if (!state) return { success: false, error: "Progetto non trovato." };

  const today = todayIso();
  const next = toggleTimeline(state, running, today);
  const { data, error } = await updateProjectRecord(user.id, projectId, next);
  if (error || !data) return { success: false, error: "Aggiornamento non riuscito." };

  // istantanea della scadenza aggiornata (solo se il progetto usa il calcolo a giorni)
  if (data.start_date && data.duration_days != null) {
    const end = computeTimeline({ ...data, legacy_end: null }, today).end;
    if (end) await updateProjectRecord(user.id, projectId, { expected_end_date: end });
  }

  revalidatePath(`/progetti/${projectId}`);
  revalidatePath("/progetti");
  revalidatePath("/lavoro");
  revalidatePath("/dashboard");
  revalidatePath("/calendario");
  return { success: true, data: undefined };
}

export async function involveContact(projectId: string, contactId: string, role: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Sessione scaduta. Accedi di nuovo." };
  if (!contactId) return { success: false, error: "Seleziona una persona." };

  const { error } = await addContactToProject(user.id, projectId, contactId, role.trim() || null);
  if (error) return { success: false, error: "Operazione non riuscita." };

  revalidatePath(`/progetti/${projectId}`);
  revalidatePath("/rubrica");
  return { success: true, data: undefined };
}

export async function removeInvolvedContact(projectId: string, projectContactId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Sessione scaduta. Accedi di nuovo." };

  const { error } = await removeContactFromProject(user.id, projectContactId);
  if (error) return { success: false, error: "Operazione non riuscita." };

  revalidatePath(`/progetti/${projectId}`);
  revalidatePath("/rubrica");
  return { success: true, data: undefined };
}
