"use server";

import { registerSchema } from "@/schemas/auth.schema";
import { signUpWithPassword } from "@/services/auth.service";
import type { ActionResult } from "@/lib/action-result";

export async function register(formData: FormData): Promise<ActionResult<{ emailConfirmationRequired: boolean }>> {
  const parsed = registerSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { data, error } = await signUpWithPassword(
    parsed.data.email,
    parsed.data.password,
    parsed.data.fullName
  );

  if (error) {
    if (error.code === "user_already_exists") {
      return { success: false, error: "Esiste già un account con questa email." };
    }
    return { success: false, error: "Non è stato possibile completare la registrazione." };
  }

  // Se la conferma email è attiva su Supabase, la sessione non è ancora
  // attiva: lo segnaliamo al form invece di reindirizzare subito.
  return {
    success: true,
    data: { emailConfirmationRequired: !data.session },
  };
}
