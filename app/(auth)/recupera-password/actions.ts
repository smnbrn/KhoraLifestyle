"use server";

import { headers } from "next/headers";

import { resetPasswordSchema } from "@/schemas/auth.schema";
import { sendPasswordResetEmail } from "@/services/auth.service";
import type { ActionResult } from "@/lib/action-result";

export async function requestPasswordReset(formData: FormData): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse({ email: formData.get("email") });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const origin = (await headers()).get("origin") ?? "";
  const redirectTo = `${origin}/auth/confirm?type=recovery&next=/recupera-password/aggiorna`;

  const { error } = await sendPasswordResetEmail(parsed.data.email, redirectTo);

  // Non riveliamo se l'email esiste o no: stesso messaggio in entrambi i casi
  // (evita di far scoprire a chiunque quali email sono registrate).
  if (error) {
    return { success: false, error: "Non è stato possibile inviare l'email. Riprova." };
  }

  return { success: true, data: undefined };
}
