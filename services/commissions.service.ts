import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

type CommissionInsert = Database["public"]["Tables"]["commissions"]["Insert"];
type CommissionUpdate = Database["public"]["Tables"]["commissions"]["Update"];

export async function listCommissions(userId: string, options: { status?: string; page?: number; pageSize?: number } = {}) {
  const supabase = await createClient();
  const { status, page = 1, pageSize = 20 } = options;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("commissions")
    .select("id, description, amount, percentage, commission_date, status, clients(name), projects(name)", {
      count: "exact",
    })
    .eq("user_id", userId);

  if (status === "to_pay" || status === "paid") query = query.eq("status", status);

  const { data, count } = await query.order("commission_date", { ascending: false }).range(from, to);
  return { commissions: data ?? [], total: count ?? 0, pageSize };
}

export async function createCommission(values: CommissionInsert) {
  const supabase = await createClient();
  return supabase.from("commissions").insert(values).select().single();
}

export async function updateCommission(userId: string, id: string, values: CommissionUpdate) {
  const supabase = await createClient();
  return supabase.from("commissions").update(values).eq("user_id", userId).eq("id", id);
}

/**
 * Segna una commissione come pagata generando anche la transazione uscita
 * collegata (categoria "Commissioni"), sullo stesso principio dei pagamenti
 * fattura in Fase 9 — ma qui, non essendoci un trigger dedicato, lo facciamo
 * esplicitamente nel service in due passaggi.
 */
export async function markCommissionPaid(userId: string, commissionId: string) {
  const supabase = await createClient();
  const { data: commission } = await supabase
    .from("commissions")
    .select("*")
    .eq("user_id", userId)
    .eq("id", commissionId)
    .single();

  if (!commission) return { error: new Error("Commissione non trovata") };
  if (commission.transaction_id) {
    // Già collegata a una transazione (es. segnata pagata in precedenza):
    // ci limitiamo ad aggiornare lo stato.
    return supabase.from("commissions").update({ status: "paid" }).eq("id", commissionId);
  }

  const { data: category } = await supabase
    .from("transaction_categories")
    .select("id")
    .eq("user_id", userId)
    .eq("type", "expense")
    .eq("name", "Commissioni")
    .maybeSingle();

  const { data: transaction, error: txError } = await supabase
    .from("transactions")
    .insert({
      user_id: userId,
      type: "expense",
      category_id: category?.id ?? null,
      description: `Commissione: ${commission.description}`,
      amount: commission.amount,
      transaction_date: new Date().toISOString().slice(0, 10),
      client_id: commission.client_id,
      project_id: commission.project_id,
    })
    .select()
    .single();

  if (txError || !transaction) return { error: txError ?? new Error("Creazione transazione non riuscita") };

  return supabase
    .from("commissions")
    .update({ status: "paid", transaction_id: transaction.id })
    .eq("id", commissionId);
}

export async function markCommissionUnpaid(userId: string, commissionId: string) {
  const supabase = await createClient();
  const { data: commission } = await supabase
    .from("commissions")
    .select("transaction_id")
    .eq("user_id", userId)
    .eq("id", commissionId)
    .single();

  if (commission?.transaction_id) {
    await supabase.from("transactions").delete().eq("id", commission.transaction_id);
  }

  return supabase
    .from("commissions")
    .update({ status: "to_pay", transaction_id: null })
    .eq("user_id", userId)
    .eq("id", commissionId);
}

export async function deleteCommission(userId: string, id: string) {
  const supabase = await createClient();
  return supabase.from("commissions").delete().eq("user_id", userId).eq("id", id);
}

export type CommissionListItem = {
  id: string;
  description: string;
  amount: number;
  percentage: number | null;
  commission_date: string;
  status: string;
  clients: { name: string } | null;
  projects: { name: string } | null;
};
