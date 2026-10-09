import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/services/profiles.service";
import type { Database } from "@/types/database.types";

type InvoiceInsert = Database["public"]["Tables"]["invoices"]["Insert"];
type InvoiceItemInsert = Database["public"]["Tables"]["invoice_items"]["Insert"];

const VALID_STATUSES = ["draft", "issued", "partially_paid", "paid", "overdue", "cancelled"] as const;
type InvoiceStatus = (typeof VALID_STATUSES)[number];

function isValidStatus(v: string | undefined): v is InvoiceStatus {
  return !!v && (VALID_STATUSES as readonly string[]).includes(v);
}

function sanitizeForOrFilter(value: string) {
  return value.replace(/[,()]/g, " ").trim();
}

/**
 * "Scaduta" non è mai scritta a db (sezione 6 dell'architettura): la
 * calcoliamo qui in lettura confrontando la scadenza con oggi. Usarla solo
 * per la UI, mai per filtrare query — per quello serve il confronto diretto
 * sulla data (vedi listInvoices).
 */
export function effectiveStatus(status: string, dueDate: string | null): string {
  const today = new Date().toISOString().slice(0, 10);
  if ((status === "issued" || status === "partially_paid") && dueDate && dueDate < today) {
    return "overdue";
  }
  return status;
}

export async function listInvoices(
  userId: string,
  options: { search?: string; status?: string; page?: number; pageSize?: number } = {}
) {
  const supabase = await createClient();
  const { search, status, page = 1, pageSize = 15 } = options;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const today = new Date().toISOString().slice(0, 10);

  let query = supabase
    .from("invoices")
    .select(
      "id, invoice_number, status, total, paid_amount, remaining_amount, issue_date, due_date, clients(name)",
      { count: "exact" }
    )
    .eq("user_id", userId);

  if (status === "overdue") {
    query = query.in("status", ["issued", "partially_paid"]).lt("due_date", today);
  } else if (isValidStatus(status)) {
    query = query.eq("status", status);
  }

  const term = search ? sanitizeForOrFilter(search) : "";
  if (term) query = query.ilike("invoice_number", `%${term}%`);

  const { data, count } = await query.order("issue_date", { ascending: false }).range(from, to);
  return { invoices: data ?? [], total: count ?? 0, pageSize };
}

export async function getInvoiceWithItems(userId: string, invoiceId: string) {
  const supabase = await createClient();
  const { data: invoice } = await supabase
    .from("invoices")
    .select("*, clients(id, name)")
    .eq("user_id", userId)
    .eq("id", invoiceId)
    .single();

  if (!invoice) return null;

  const { data: items } = await supabase
    .from("invoice_items")
    .select("*")
    .eq("invoice_id", invoiceId)
    .order("sort_order", { ascending: true });

  return { invoice, items: items ?? [] };
}

async function generateInvoiceNumber(): Promise<string> {
  const supabase = await createClient();
  const year = new Date().getFullYear();

  const { data: nextNumber, error } = await supabase.rpc("get_next_document_number", {
    p_document_type: "invoice",
    p_year: year,
  });
  if (error || nextNumber == null) throw new Error("Impossibile generare il numero fattura");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const profile = user ? await getProfile(user.id) : null;
  const prefix = profile?.data?.invoice_number_prefix ?? "";

  return `${prefix}${year}-${String(nextNumber).padStart(4, "0")}`;
}

export async function createInvoiceWithItems(
  userId: string,
  header: Omit<InvoiceInsert, "user_id" | "invoice_number">,
  items: Omit<InvoiceItemInsert, "user_id" | "invoice_id">[]
) {
  const supabase = await createClient();
  const invoiceNumber = await generateInvoiceNumber();

  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .insert({ ...header, user_id: userId, invoice_number: invoiceNumber })
    .select()
    .single();

  if (invoiceError || !invoice) {
    return { error: invoiceError ?? new Error("Creazione fattura non riuscita") };
  }

  const { error: itemsError } = await supabase
    .from("invoice_items")
    .insert(items.map((item, index) => ({ ...item, user_id: userId, invoice_id: invoice.id, sort_order: index })));

  if (itemsError) {
    await supabase.from("invoices").delete().eq("id", invoice.id);
    return { error: itemsError };
  }

  return { data: invoice };
}

export async function updateInvoiceWithItems(
  userId: string,
  invoiceId: string,
  header: Partial<InvoiceInsert>,
  items: Omit<InvoiceItemInsert, "user_id" | "invoice_id">[]
) {
  const supabase = await createClient();

  const { error: invoiceError } = await supabase
    .from("invoices")
    .update(header)
    .eq("user_id", userId)
    .eq("id", invoiceId);
  if (invoiceError) return { error: invoiceError };

  const { error: deleteError } = await supabase.from("invoice_items").delete().eq("invoice_id", invoiceId);
  if (deleteError) return { error: deleteError };

  const { error: insertError } = await supabase
    .from("invoice_items")
    .insert(items.map((item, index) => ({ ...item, user_id: userId, invoice_id: invoiceId, sort_order: index })));

  return { error: insertError ?? null };
}

export async function changeInvoiceStatus(userId: string, invoiceId: string, status: string) {
  if (!isValidStatus(status)) return { error: new Error("Stato non valido") };
  const supabase = await createClient();
  return supabase.from("invoices").update({ status }).eq("user_id", userId).eq("id", invoiceId);
}

/**
 * Solo le fatture in bozza si possono cancellare fisicamente: oltre quello
 * stato si "annullano" (status = cancelled) per preservare la sequenza di
 * numerazione — decisione della sezione 6 dell'architettura, qui applicata
 * davvero (per i Preventivi in Fase 8 avevamo scelto diversamente).
 */
export async function deleteOrCancelInvoice(userId: string, invoiceId: string, currentStatus: string) {
  const supabase = await createClient();
  if (currentStatus === "draft") {
    return supabase.from("invoices").delete().eq("user_id", userId).eq("id", invoiceId);
  }
  return supabase.from("invoices").update({ status: "cancelled" }).eq("user_id", userId).eq("id", invoiceId);
}

export type InvoiceListItem = {
  id: string;
  invoice_number: string;
  status: string;
  total: number;
  paid_amount: number;
  remaining_amount: number | null;
  issue_date: string;
  due_date: string | null;
  clients: { name: string } | null;
};
