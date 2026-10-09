import "server-only";

import { createClient } from "@/lib/supabase/server";

// Query "di sola lettura" per le tab della pagina cliente che mostrano dati
// da moduli non ancora costruiti come sezione a sé (Progetti = Fase 6,
// Preventivi = Fase 8, Fatture/Pagamenti = Fase 9). I dati sono reali fin
// da ora; i link alle rispettive pagine di dettaglio arriveranno con quelle
// fasi.
export async function listProjectsByClient(userId: string, clientId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select("id, name, status, project_value")
    .eq("user_id", userId)
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function listQuotesByClient(userId: string, clientId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("quotes")
    .select("id, quote_number, status, total, issue_date")
    .eq("user_id", userId)
    .eq("client_id", clientId)
    .order("issue_date", { ascending: false });
  return data ?? [];
}

export async function listInvoicesByClient(userId: string, clientId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("invoices")
    .select("id, invoice_number, status, total, paid_amount, issue_date")
    .eq("user_id", userId)
    .eq("client_id", clientId)
    .order("issue_date", { ascending: false });
  return data ?? [];
}

export async function listPaymentsByClient(userId: string, clientId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("payments")
    .select("id, amount, payment_date, payment_method, invoices!inner(invoice_number, client_id)")
    .eq("user_id", userId)
    .eq("invoices.client_id", clientId)
    .order("payment_date", { ascending: false });
  return data ?? [];
}

// ---------------------------------------------------------------
// Stesse liste, ma filtrate per progetto (pagina di dettaglio Progetti)
// ---------------------------------------------------------------
export async function listTasksByProject(userId: string, projectId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tasks")
    .select("id, title, status, priority, due_date, start_date, duration_days, timeline_running, frozen_since, frozen_days")
    .eq("user_id", userId)
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function listQuotesByProject(userId: string, projectId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("quotes")
    .select("id, quote_number, status, total, issue_date")
    .eq("user_id", userId)
    .eq("project_id", projectId)
    .order("issue_date", { ascending: false });
  return data ?? [];
}

export async function listInvoicesByProject(userId: string, projectId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("invoices")
    .select("id, invoice_number, status, total, paid_amount, issue_date")
    .eq("user_id", userId)
    .eq("project_id", projectId)
    .order("issue_date", { ascending: false });
  return data ?? [];
}
