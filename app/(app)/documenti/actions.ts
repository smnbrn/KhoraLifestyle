"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/services/auth.service";
import { uploadDocument, deleteDocument, getSignedDownloadUrl, type DocumentLink } from "@/services/documents.service";
import type { ActionResult } from "@/lib/action-result";

export async function uploadDocumentAction(formData: FormData, link: DocumentLink): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Sessione scaduta. Accedi di nuovo." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { success: false, error: "Seleziona un file." };
  }

  const { error } = await uploadDocument(user.id, file, link);
  if (error) return { success: false, error: error.message };

  revalidatePath("/documenti");
  if (link.clientId) revalidatePath(`/clienti/${link.clientId}`);
  if (link.projectId) revalidatePath(`/progetti/${link.projectId}`);
  return { success: true, data: undefined };
}

export async function removeDocument(documentId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Sessione scaduta. Accedi di nuovo." };

  const { error } = await deleteDocument(user.id, documentId);
  if (error) return { success: false, error: "Eliminazione non riuscita." };

  revalidatePath("/documenti");
  return { success: true, data: undefined };
}

export async function getDownloadUrl(storagePath: string): Promise<ActionResult<{ url: string }>> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Sessione scaduta. Accedi di nuovo." };

  const url = await getSignedDownloadUrl(storagePath);
  if (!url) return { success: false, error: "Impossibile generare il link di download." };

  return { success: true, data: { url } };
}
