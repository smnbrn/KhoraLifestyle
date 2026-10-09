"use server";

import { revalidatePath } from "next/cache";

import { profileSchema } from "@/schemas/profile.schema";
import { getCurrentUser } from "@/services/auth.service";
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
