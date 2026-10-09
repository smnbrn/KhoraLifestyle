"use server";

import { redirect } from "next/navigation";

import { updatePasswordSchema } from "@/schemas/auth.schema";
import { updateUserPassword } from "@/services/auth.service";
import type { ActionResult } from "@/lib/action-result";

export async function updatePassword(formData: FormData): Promise<ActionResult> {
  const parsed = updatePasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  // Richiede una sessione di recupero attiva, stabilita dal route handler
  // /auth/confirm dopo aver verificato il link ricevuto via email.
  const { error } = await updateUserPassword(parsed.data.password);

  if (error) {
    return { success: false, error: "Non è stato possibile aggiornare la password. Richiedi un nuovo link." };
  }

  redirect("/dashboard");
}
