import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

type ContactInsert = Database["public"]["Tables"]["contacts"]["Insert"];
type ContactUpdate = Database["public"]["Tables"]["contacts"]["Update"];
export type ContactRow = Database["public"]["Tables"]["contacts"]["Row"];

const VALID_KINDS = ["client", "collaborator", "supplier", "other"] as const;

function sanitizeForOrFilter(value: string) {
  return value.replace(/[,()]/g, " ").trim();
}

export async function listContacts(
  userId: string,
  options: { search?: string; kind?: string; showArchived?: boolean } = {}
) {
  const supabase = await createClient();
  const { search, kind, showArchived = false } = options;

  let query = supabase.from("contacts").select("*, clients(name)").eq("user_id", userId);
  query = showArchived ? query.not("archived_at", "is", null) : query.is("archived_at", null);
  if (kind && (VALID_KINDS as readonly string[]).includes(kind)) {
    query = query.eq("kind", kind as (typeof VALID_KINDS)[number]);
  }
  const term = search ? sanitizeForOrFilter(search) : "";
  if (term) {
    query = query.or(`name.ilike.%${term}%,company.ilike.%${term}%,email.ilike.%${term}%,role.ilike.%${term}%`);
  }
  const { data } = await query.order("name", { ascending: true });
  return data ?? [];
}

export type ContactListItem = Awaited<ReturnType<typeof listContacts>>[number];

export async function listContactsForSelect(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("contacts")
    .select("id, name, company")
    .eq("user_id", userId)
    .is("archived_at", null)
    .order("name", { ascending: true });
  return data ?? [];
}

export async function createContactRecord(values: ContactInsert) {
  const supabase = await createClient();
  return supabase.from("contacts").insert(values).select().single();
}

export async function updateContactRecord(userId: string, id: string, values: ContactUpdate) {
  const supabase = await createClient();
  return supabase.from("contacts").update(values).eq("user_id", userId).eq("id", id).select().single();
}

export async function archiveContact(userId: string, id: string, archived: boolean) {
  const supabase = await createClient();
  return supabase
    .from("contacts")
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq("user_id", userId)
    .eq("id", id);
}

export async function deleteContactRecord(userId: string, id: string) {
  const supabase = await createClient();
  return supabase.from("contacts").delete().eq("user_id", userId).eq("id", id);
}

// ---- Persone coinvolte in un progetto ----
export async function listProjectContacts(userId: string, projectId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("project_contacts")
    .select("id, role, contacts(id, name, company, email, phone, kind)")
    .eq("user_id", userId)
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });
  return data ?? [];
}

export async function listContactProjects(userId: string, contactId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("project_contacts")
    .select("role, projects(id, name)")
    .eq("user_id", userId)
    .eq("contact_id", contactId);
  return data ?? [];
}

export async function addContactToProject(userId: string, projectId: string, contactId: string, role: string | null) {
  const supabase = await createClient();
  return supabase
    .from("project_contacts")
    .upsert({ user_id: userId, project_id: projectId, contact_id: contactId, role }, { onConflict: "project_id,contact_id" });
}

export async function removeContactFromProject(userId: string, projectContactId: string) {
  const supabase = await createClient();
  return supabase.from("project_contacts").delete().eq("user_id", userId).eq("id", projectContactId);
}
