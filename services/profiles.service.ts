import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

export async function getProfile(userId: string) {
  const supabase = await createClient();
  return supabase.from("profiles").select("*").eq("id", userId).single();
}

export async function updateProfile(userId: string, values: ProfileUpdate) {
  const supabase = await createClient();
  return supabase.from("profiles").update(values).eq("id", userId).select().single();
}
