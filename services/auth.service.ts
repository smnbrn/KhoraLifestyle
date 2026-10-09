import "server-only";

import { createClient } from "@/lib/supabase/server";

// Layer sottile sopra Supabase Auth — le Server Action chiamano queste
// funzioni, mai il client Supabase direttamente (stesso principio del
// resto di services/).

export async function signInWithPassword(email: string, password: string) {
  const supabase = await createClient();
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUpWithPassword(email: string, password: string, fullName: string) {
  const supabase = await createClient();
  return supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });
}

export async function sendPasswordResetEmail(email: string, redirectTo: string) {
  const supabase = await createClient();
  return supabase.auth.resetPasswordForEmail(email, { redirectTo });
}

export async function updateUserPassword(password: string) {
  const supabase = await createClient();
  return supabase.auth.updateUser({ password });
}

export async function signOut() {
  const supabase = await createClient();
  return supabase.auth.signOut();
}

export async function getCurrentUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user;
}
