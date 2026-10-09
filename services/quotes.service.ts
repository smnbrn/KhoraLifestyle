import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/services/profiles.service";
import type { Database } from "@/types/database.types";

type QuoteInsert = Database["public"]["Tables"]["quotes"]["Insert"];
type QuoteItemInsert = Database["public"]["Tables"]["quote_items"]["Insert"];

const VALID_STATUSES = ["draft", "sent", "accepted", "rejected", "expired"] as const;
type QuoteStatus = (typeof VALID_STATUSES)[number];

function isValidStatus(v: string | undefined): v is QuoteStatus {
  return !!v && (VALID_STATUSES as readonly string[]).includes(v);
}

function sanitizeForOrFilter(value: string) {
  return value.replace(/[,()]/g, " ").trim();
}

export async function listQuotes(
  userId: string,
  options: { search?: string; status?: string; page?: number; pageSize?: number } = {}
) {
  const supabase = await createClient();
  const { search, status, page = 1, pageSize = 15 } = options;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("quotes")
    .select("id, quote_number, status, total, issue_date, expiry_date, clients(name)", { count: "exact" })
    .eq("user_id", userId);

  if (isValidStatus(status)) query = query.eq("status", status);

  const term = search ? sanitizeForOrFilter(search) : "";
  if (term) query = query.ilike("quote_number", `%${term}%`);

  const { data, count } = await query.order("issue_date", { ascending: false }).range(from, to);
  return { quotes: data ?? [], total: count ?? 0, pageSize };
}

export async function getQuoteWithItems(userId: string, quoteId: string) {
  const supabase = await createClient();
  const { data: quote } = await supabase
    .from("quotes")
    .select("*, clients(id, name)")
    .eq("user_id", userId)
    .eq("id", quoteId)
    .single();

  if (!quote) return null;

  const { data: items } = await supabase
    .from("quote_items")
    .select("*")
    .eq("quote_id", quoteId)
    .order("sort_order", { ascending: true });

  return { quote, items: items ?? [] };
}

/**
 * Genera il numero progressivo `[prefisso]AAAA-NNNN` chiamando la funzione
 * atomica get_next_document_number (Fase 8, testata contro Postgres locale).
 */
async function generateQuoteNumber(): Promise<string> {
  const supabase = await createClient();
  const year = new Date().getFullYear();

  const { data: nextNumber, error } = await supabase.rpc("get_next_document_number", {
    p_document_type: "quote",
    p_year: year,
  });
  if (error || nextNumber == null) throw new Error("Impossibile generare il numero preventivo");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const profile = user ? await getProfile(user.id) : null;
  const prefix = profile?.data?.quote_number_prefix ?? "";

  return `${prefix}${year}-${String(nextNumber).padStart(4, "0")}`;
}

export async function createQuoteWithItems(
  userId: string,
  header: Omit<QuoteInsert, "user_id" | "quote_number">,
  items: Omit<QuoteItemInsert, "user_id" | "quote_id">[]
) {
  const supabase = await createClient();
  const quoteNumber = await generateQuoteNumber();

  const { data: quote, error: quoteError } = await supabase
    .from("quotes")
    .insert({ ...header, user_id: userId, quote_number: quoteNumber })
    .select()
    .single();

  if (quoteError || !quote) {
    return { error: quoteError ?? new Error("Creazione preventivo non riuscita") };
  }

  const { error: itemsError } = await supabase
    .from("quote_items")
    .insert(items.map((item, index) => ({ ...item, user_id: userId, quote_id: quote.id, sort_order: index })));

  if (itemsError) {
    // Compensazione: senza righe il preventivo non ha senso, e vogliamo
    // liberare il numero appena generato da un fallimento parziale.
    await supabase.from("quotes").delete().eq("id", quote.id);
    return { error: itemsError };
  }

  return { data: quote };
}

export async function updateQuoteWithItems(
  userId: string,
  quoteId: string,
  header: Partial<QuoteInsert>,
  items: Omit<QuoteItemInsert, "user_id" | "quote_id">[]
) {
  const supabase = await createClient();

  const { error: quoteError } = await supabase
    .from("quotes")
    .update(header)
    .eq("user_id", userId)
    .eq("id", quoteId);

  if (quoteError) return { error: quoteError };

  // Sostituzione completa delle righe: più semplice e sicuro che calcolare
  // un diff, dato che le righe non hanno un significato proprio fuori dal
  // documento a cui appartengono.
  const { error: deleteError } = await supabase.from("quote_items").delete().eq("quote_id", quoteId);
  if (deleteError) return { error: deleteError };

  const { error: insertError } = await supabase
    .from("quote_items")
    .insert(items.map((item, index) => ({ ...item, user_id: userId, quote_id: quoteId, sort_order: index })));

  return { error: insertError ?? null };
}

export async function changeQuoteStatus(userId: string, quoteId: string, status: string) {
  if (!isValidStatus(status)) return { error: new Error("Stato non valido") };
  const supabase = await createClient();
  return supabase.from("quotes").update({ status }).eq("user_id", userId).eq("id", quoteId);
}

export async function deleteQuoteRecord(userId: string, quoteId: string) {
  const supabase = await createClient();
  return supabase.from("quotes").delete().eq("user_id", userId).eq("id", quoteId);
}

export type QuoteListItem = {
  id: string;
  quote_number: string;
  status: string;
  total: number;
  issue_date: string;
  expiry_date: string | null;
  clients: { name: string } | null;
};
