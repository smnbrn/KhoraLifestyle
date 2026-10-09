"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/services/auth.service";
import { addClientNote, deleteNote } from "@/services/notes.service";
import type { ActionResult } from "@/lib/action-result";

export async function createClientNote(clientId: string, content: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Sessione scaduta. Accedi di nuovo." };
  if (!content.trim()) return { success: false, error: "La nota non può essere vuota." };

  const { error } = await addClientNote(user.id, clientId, content.trim());
  if (error) return { success: false, error: "Salvataggio non riuscito." };

  revalidatePath(`/clienti/${clientId}`);
  return { success: true, data: undefined };
}

export async function removeClientNote(clientId: string, noteId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Sessione scaduta. Accedi di nuovo." };

  const { error } = await deleteNote(user.id, noteId);
  if (error) return { success: false, error: "Eliminazione non riuscita." };

  revalidatePath(`/clienti/${clientId}`);
  return { success: true, data: undefined };
}
