"use server";

import { revalidatePath } from "next/cache";

import { contactSchema } from "@/schemas/contact.schema";
import { getCurrentUser } from "@/services/auth.service";
import {
  archiveContact,
  createContactRecord,
  deleteContactRecord,
  updateContactRecord,
} from "@/services/contacts.service";
import type { ActionResult } from "@/lib/action-result";

export async function saveContact(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Sessione scaduta. Accedi di nuovo." };

  const parsed = contactSchema.safeParse({
    name: formData.get("name"),
    kind: formData.get("kind"),
    company: formData.get("company") || undefined,
    role: formData.get("role") || undefined,
    email: formData.get("email") || undefined,
    phone: formData.get("phone") || undefined,
    clientId: formData.get("clientId") || undefined,
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const id = formData.get("id") as string | null;
  const values = {
    name: parsed.data.name.trim(),
    kind: parsed.data.kind,
    company: parsed.data.company?.trim() || null,
    role: parsed.data.role?.trim() || null,
    email: parsed.data.email?.trim() || null,
    phone: parsed.data.phone?.trim() || null,
    client_id: parsed.data.clientId || null,
    notes: parsed.data.notes?.trim() || null,
  };

  const { data, error } = id
    ? await updateContactRecord(user.id, id, values)
    : await createContactRecord({ ...values, user_id: user.id });
  if (error || !data) return { success: false, error: "Salvataggio non riuscito. Riprova." };

  revalidatePath("/rubrica");
  return { success: true, data: { id: data.id } };
}

export async function toggleArchiveContact(id: string, archived: boolean): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Sessione scaduta. Accedi di nuovo." };
  const { error } = await archiveContact(user.id, id, archived);
  if (error) return { success: false, error: "Operazione non riuscita." };
  revalidatePath("/rubrica");
  return { success: true, data: undefined };
}

export async function deleteContact(id: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Sessione scaduta. Accedi di nuovo." };
  const { error } = await deleteContactRecord(user.id, id);
  if (error) return { success: false, error: "Eliminazione non riuscita." };
  revalidatePath("/rubrica");
  return { success: true, data: undefined };
}
