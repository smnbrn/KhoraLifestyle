import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

type TransactionInsert = Database["public"]["Tables"]["transactions"]["Insert"];
type TransactionUpdate = Database["public"]["Tables"]["transactions"]["Update"];

const DEFAULT_INCOME_CATEGORIES = ["Pagamento cliente", "Vendita", "Altro"];
const DEFAULT_EXPENSE_CATEGORIES = [
  "Software",
  "Fornitori",
  "Marketing",
  "Pubblicità",
  "Attrezzatura",
  "Consulenze",
  "Commissioni",
  "Tasse",
  "Altro",
];

/**
 * Le categorie di default (sezione 12 del documento) vengono create alla
 * prima visita della sezione Finanze invece che in un trigger di
 * registrazione: più semplice da mantenere, e funziona anche per gli utenti
 * già esistenti prima che questa fase fosse costruita.
 */
export async function ensureDefaultCategories(userId: string) {
  const supabase = await createClient();
  const { count } = await supabase
    .from("transaction_categories")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (count && count > 0) return;

  const rows = [
    ...DEFAULT_INCOME_CATEGORIES.map((name) => ({ user_id: userId, name, type: "income" as const, is_default: true })),
    ...DEFAULT_EXPENSE_CATEGORIES.map((name) => ({ user_id: userId, name, type: "expense" as const, is_default: true })),
  ];
  await supabase.from("transaction_categories").insert(rows);
}

export async function listCategories(userId: string, type?: "income" | "expense") {
  const supabase = await createClient();
  let query = supabase.from("transaction_categories").select("id, name, type").eq("user_id", userId);
  if (type) query = query.eq("type", type);
  const { data } = await query.order("name", { ascending: true });
  return data ?? [];
}

export async function createCategory(userId: string, name: string, type: "income" | "expense") {
  const supabase = await createClient();
  return supabase.from("transaction_categories").insert({ user_id: userId, name, type }).select().single();
}

const VALID_TYPES = ["income", "expense"] as const;
function isValidType(v: string | undefined): v is "income" | "expense" {
  return !!v && (VALID_TYPES as readonly string[]).includes(v);
}

export async function listTransactions(
  userId: string,
  options: { type?: string; categoryId?: string; page?: number; pageSize?: number } = {}
) {
  const supabase = await createClient();
  const { type, categoryId, page = 1, pageSize = 20 } = options;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("transactions")
    .select(
      "id, type, description, amount, transaction_date, payment_method, transaction_categories(name), clients(name), projects(name)",
      { count: "exact" }
    )
    .eq("user_id", userId);

  if (isValidType(type)) query = query.eq("type", type);
  if (categoryId) query = query.eq("category_id", categoryId);

  const { data, count } = await query.order("transaction_date", { ascending: false }).range(from, to);
  return { transactions: data ?? [], total: count ?? 0, pageSize };
}

export async function getFinanceSummary(userId: string, start: string, end: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("transactions")
    .select("type, amount")
    .eq("user_id", userId)
    .gte("transaction_date", start)
    .lte("transaction_date", end);

  const rows = data ?? [];
  const income = rows.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const expenses = rows.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
  return { income, expenses, profit: income - expenses };
}

export async function createTransaction(values: TransactionInsert) {
  const supabase = await createClient();
  return supabase.from("transactions").insert(values).select().single();
}

export async function updateTransaction(userId: string, id: string, values: TransactionUpdate) {
  const supabase = await createClient();
  return supabase.from("transactions").update(values).eq("user_id", userId).eq("id", id);
}

export async function deleteTransaction(userId: string, id: string) {
  const supabase = await createClient();
  // Se la transazione è nata da un pagamento (payment_id valorizzato), il
  // modo corretto per rimuoverla è cancellare il pagamento dalla fattura
  // (Fase 9) — farlo da qui lascerebbe la fattura con importi disallineati.
  return supabase.from("transactions").delete().eq("user_id", userId).eq("id", id).is("payment_id", null);
}

export type TransactionListItem = {
  id: string;
  type: string;
  description: string | null;
  amount: number;
  transaction_date: string;
  payment_method: string | null;
  transaction_categories: { name: string } | null;
  clients: { name: string } | null;
  projects: { name: string } | null;
};
