"use server";

import { revalidatePath } from "next/cache";

import { clientSchema } from "@/schemas/client.schema";
import { getCurrentUser } from "@/services/auth.service";
import {
  createClientRecord,
  updateClientRecord,
  archiveClient,
  deleteClientRecord,
} from "@/services/clients.service";
import type { ActionResult } from "@/lib/action-result";

function parseClientForm(formData: FormData) {
  return clientSchema.safeParse({
    name: formData.get("name"),
    referentName: formData.get("referentName") || undefined,
    email: formData.get("email") || undefined,
    phone: formData.get("phone") || undefined,
    vatNumber: formData.get("vatNumber") || undefined,
    taxCode: formData.get("taxCode") || undefined,
    address: formData.get("address") || undefined,
    city: formData.get("city") || undefined,
    postalCode: formData.get("postalCode") || undefined,
    province: formData.get("province") || undefined,
    country: formData.get("country") || undefined,
    notes: formData.get("notes") || undefined,
  });
}

export async function saveClient(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Sessione scaduta. Accedi di nuovo." };

  const parsed = parseClientForm(formData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const clientId = formData.get("id") as string | null;
  const values = {
    name: parsed.data.name,
    referent_name: parsed.data.referentName || null,
    email: parsed.data.email || null,
    phone: parsed.data.phone || null,
    vat_number: parsed.data.vatNumber || null,
    tax_code: parsed.data.taxCode || null,
    address: parsed.data.address || null,
    city: parsed.data.city || null,
    postal_code: parsed.data.postalCode || null,
    province: parsed.data.province || null,
    country: parsed.data.country || "Italia",
    notes: parsed.data.notes || null,
  };

  const { data, error } = clientId
    ? await updateClientRecord(user.id, clientId, values)
    : await createClientRecord({ ...values, user_id: user.id });

  if (error || !data) {
    return { success: false, error: "Salvataggio non riuscito. Riprova." };
  }

  revalidatePath("/clienti");
  revalidatePath(`/clienti/${data.id}`);
  return { success: true, data: { id: data.id } };
}

export async function toggleArchiveClient(clientId: string, archived: boolean): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Sessione scaduta. Accedi di nuovo." };

  const { error } = await archiveClient(user.id, clientId, archived);
  if (error) return { success: false, error: "Operazione non riuscita." };

  revalidatePath("/clienti");
  revalidatePath(`/clienti/${clientId}`);
  return { success: true, data: undefined };
}

export async function deleteClient(clientId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Sessione scaduta. Accedi di nuovo." };

  const { error } = await deleteClientRecord(user.id, clientId);
  if (error) {
    // Es. violazione "on delete restrict" perché esistono progetti/fatture collegati
    return {
      success: false,
      error: "Impossibile eliminare: il cliente ha progetti, preventivi o fatture collegati. Archivialo invece.",
    };
  }

  revalidatePath("/clienti");
  return { success: true, data: undefined };
}
