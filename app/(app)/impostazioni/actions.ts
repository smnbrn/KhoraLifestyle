"use server";

import { revalidatePath } from "next/cache";

import { changePasswordSchema } from "@/schemas/auth.schema";
import { profileSchema } from "@/schemas/profile.schema";
import { getCurrentUser, signInWithPassword, updateUserPassword } from "@/services/auth.service";
import { updateProfile } from "@/services/profiles.service";
import type { ActionResult } from "@/lib/action-result";

export async function saveProfile(formData: FormData): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Sessione scaduta. Accedi di nuovo." };
  }

  const parsed = profileSchema.safeParse({
    fullName: formData.get("fullName"),
    companyName: formData.get("companyName"),
    vatNumber: formData.get("vatNumber"),
    taxCode: formData.get("taxCode"),
    address: formData.get("address"),
    city: formData.get("city"),
    postalCode: formData.get("postalCode"),
    province: formData.get("province"),
    country: formData.get("country"),
    phone: formData.get("phone"),
    defaultVatRate: formData.get("defaultVatRate"),
    invoiceNumberPrefix: formData.get("invoiceNumberPrefix"),
    quoteNumberPrefix: formData.get("quoteNumberPrefix"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { error } = await updateProfile(user.id, {
    full_name: parsed.data.fullName,
    company_name: parsed.data.companyName || null,
    vat_number: parsed.data.vatNumber || null,
    tax_code: parsed.data.taxCode || null,
    address: parsed.data.address || null,
    city: parsed.data.city || null,
    postal_code: parsed.data.postalCode || null,
    province: parsed.data.province || null,
    country: parsed.data.country,
    phone: parsed.data.phone || null,
    default_vat_rate: parsed.data.defaultVatRate,
    invoice_number_prefix: parsed.data.invoiceNumberPrefix || "",
    quote_number_prefix: parsed.data.quoteNumberPrefix || "",
  });

  if (error) {
    return { success: false, error: "Salvataggio non riuscito. Riprova." };
  }

  revalidatePath("/impostazioni");
  return { success: true, data: undefined };
}

export async function changePassword(formData: FormData): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user || !user.email) {
    return { success: false, error: "Sessione scaduta. Accedi di nuovo." };
  }

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  // Si verifica la password attuale prima di cambiarla: chi trova l'app
  // aperta su un computer non può bloccare fuori il proprietario.
  const { error: verifyError } = await signInWithPassword(user.email, parsed.data.currentPassword);
  if (verifyError) {
    return { success: false, error: "La password attuale non è corretta." };
  }

  const { error } = await updateUserPassword(parsed.data.password);
  if (error) {
    return { success: false, error: "Non è stato possibile cambiare la password. Riprova." };
  }

  return { success: true, data: undefined };
}
