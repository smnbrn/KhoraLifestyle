import "server-only";

import { createClient } from "@/lib/supabase/server";

export async function listClientNotes(userId: string, clientId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("notes")
    .select("id, content, created_at")
    .eq("user_id", userId)
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function addClientNote(userId: string, clientId: string, content: string) {
  const supabase = await createClient();
  return supabase.from("notes").insert({ user_id: userId, client_id: clientId, content }).select().single();
}

export async function deleteNote(userId: string, noteId: string) {
  const supabase = await createClient();
  return supabase.from("notes").delete().eq("user_id", userId).eq("id", noteId);
}

export async function listProjectNotes(userId: string, projectId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("notes")
    .select("id, content, created_at")
    .eq("user_id", userId)
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function addProjectNote(userId: string, projectId: string, content: string) {
  const supabase = await createClient();
  return supabase.from("notes").insert({ user_id: userId, project_id: projectId, content }).select().single();
}
