"use server";

import { redirect } from "next/navigation";

import { loginSchema } from "@/schemas/auth.schema";
import { signInWithPassword } from "@/services/auth.service";
import type { ActionResult } from "@/lib/action-result";

export async function login(formData: FormData): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { error } = await signInWithPassword(parsed.data.email, parsed.data.password);

  if (error) {
    return { success: false, error: "Email o password non corrette." };
  }

  redirect("/dashboard");
}
