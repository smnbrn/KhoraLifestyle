import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

type ClientRow = Database["public"]["Tables"]["clients"]["Row"];
type ClientInsert = Database["public"]["Tables"]["clients"]["Insert"];
type ClientUpdate = Database["public"]["Tables"]["clients"]["Update"];

// PostgREST usa la virgola per separare le condizioni dentro .or() e le
// parentesi per raggrupparle: le togliamo dal termine cercato per non
// rompere la sintassi del filtro con un input qualsiasi dell'utente.
function sanitizeForOrFilter(value: string) {
  return value.replace(/[,()]/g, " ").trim();
}

export async function listClients(
  userId: string,
  options: { search?: string; page?: number; pageSize?: number; showArchived?: boolean } = {}
) {
  const supabase = await createClient();
  const { search, page = 1, pageSize = 15, showArchived = false } = options;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("clients")
    .select("id, name, referent_name, email, phone, city, archived_at", { count: "exact" })
    .eq("user_id", userId);

  query = showArchived ? query.not("archived_at", "is", null) : query.is("archived_at", null);

  const term = search ? sanitizeForOrFilter(search) : "";
  if (term) {
    query = query.or(`name.ilike.%${term}%,referent_name.ilike.%${term}%,email.ilike.%${term}%`);
  }

  const { data, count } = await query.order("name", { ascending: true }).range(from, to);

  return { clients: data ?? [], total: count ?? 0, pageSize };
}

export async function getClientById(userId: string, clientId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("clients").select("*").eq("user_id", userId).eq("id", clientId).single();
  return data;
}

export async function getClientFinancials(clientId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("client_financials").select("*").eq("client_id", clientId).maybeSingle();
  return data ?? { total_invoiced: 0, total_collected: 0, total_outstanding: 0 };
}

export async function createClientRecord(values: ClientInsert) {
  const supabase = await createClient();
  return supabase.from("clients").insert(values).select().single();
}

export async function updateClientRecord(userId: string, clientId: string, values: ClientUpdate) {
  const supabase = await createClient();
  return supabase.from("clients").update(values).eq("user_id", userId).eq("id", clientId).select().single();
}

export async function archiveClient(userId: string, clientId: string, archived: boolean) {
  const supabase = await createClient();
  return supabase
    .from("clients")
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq("user_id", userId)
    .eq("id", clientId);
}

export async function deleteClientRecord(userId: string, clientId: string) {
  const supabase = await createClient();
  // Bloccato dal vincolo "on delete restrict" se esistono progetti/fatture/
  // preventivi collegati: in quel caso l'errore va gestito e comunicato
  // all'utente, non nascosto (vedi actions.ts).
  return supabase.from("clients").delete().eq("user_id", userId).eq("id", clientId);
}

export type ClientListItem = Pick<
  ClientRow,
  "id" | "name" | "referent_name" | "email" | "phone" | "city" | "archived_at"
>;
