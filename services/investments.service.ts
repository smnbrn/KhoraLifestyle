import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

type InvestmentInsert = Database["public"]["Tables"]["investments"]["Insert"];
type InvestmentUpdate = Database["public"]["Tables"]["investments"]["Update"];
type MovementInsert = Database["public"]["Tables"]["investment_movements"]["Insert"];
export type InvestmentRow = Database["public"]["Tables"]["investments"]["Row"];
export type MovementRow = Database["public"]["Tables"]["investment_movements"]["Row"];

export type InvestmentSummary = InvestmentRow & {
  /** versamenti - prelievi */
  invested: number;
  /** valore attuale se inserito, altrimenti null */
  gain: number | null;
  gainPercent: number | null;
  movementsCount: number;
};

export async function listInvestments(userId: string, showArchived = false) {
  const supabase = await createClient();
  let query = supabase.from("investments").select("*").eq("user_id", userId);
  query = showArchived ? query.not("archived_at", "is", null) : query.is("archived_at", null);

  const [{ data: investments }, { data: movements }] = await Promise.all([
    query.order("created_at", { ascending: true }),
    supabase.from("investment_movements").select("investment_id, kind, amount").eq("user_id", userId),
  ]);

  const byInvestment = new Map<string, { invested: number; count: number }>();
  for (const m of movements ?? []) {
    const cur = byInvestment.get(m.investment_id) ?? { invested: 0, count: 0 };
    cur.invested += m.kind === "deposit" ? Number(m.amount) : -Number(m.amount);
    cur.count += 1;
    byInvestment.set(m.investment_id, cur);
  }

  const items: InvestmentSummary[] = (investments ?? []).map((inv) => {
    const agg = byInvestment.get(inv.id) ?? { invested: 0, count: 0 };
    const value = inv.current_value != null ? Number(inv.current_value) : null;
    const gain = value != null ? value - agg.invested : null;
    return {
      ...inv,
      invested: agg.invested,
      gain,
      gainPercent: gain != null && agg.invested > 0 ? (gain / agg.invested) * 100 : null,
      movementsCount: agg.count,
    };
  });

  return items;
}

export function summarizeInvestments(items: InvestmentSummary[]) {
  const invested = items.reduce((s, i) => s + i.invested, 0);
  // Valore complessivo: dove manca il valore attuale, uso quanto versato (nessun guadagno/perdita noto).
  const currentValue = items.reduce((s, i) => s + (i.current_value != null ? Number(i.current_value) : i.invested), 0);
  const gain = currentValue - invested;
  const byKind = new Map<string, number>();
  for (const i of items) {
    const v = i.current_value != null ? Number(i.current_value) : i.invested;
    byKind.set(i.kind, (byKind.get(i.kind) ?? 0) + v);
  }
  return {
    invested,
    currentValue,
    gain,
    gainPercent: invested > 0 ? (gain / invested) * 100 : null,
    allocation: Array.from(byKind.entries()).map(([kind, value]) => ({ kind, value })).filter((a) => a.value > 0),
  };
}

export async function listMovements(userId: string, investmentId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("investment_movements")
    .select("*")
    .eq("user_id", userId)
    .eq("investment_id", investmentId)
    .order("movement_date", { ascending: false })
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getInvestmentById(userId: string, id: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("investments").select("*").eq("user_id", userId).eq("id", id).single();
  return data;
}

export async function createInvestment(values: InvestmentInsert) {
  const supabase = await createClient();
  return supabase.from("investments").insert(values).select().single();
}

export async function updateInvestment(userId: string, id: string, values: InvestmentUpdate) {
  const supabase = await createClient();
  return supabase.from("investments").update(values).eq("user_id", userId).eq("id", id).select().single();
}

export async function archiveInvestment(userId: string, id: string, archived: boolean) {
  const supabase = await createClient();
  return supabase
    .from("investments")
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq("user_id", userId)
    .eq("id", id);
}

export async function deleteInvestment(userId: string, id: string) {
  const supabase = await createClient();
  return supabase.from("investments").delete().eq("user_id", userId).eq("id", id);
}

export async function createMovement(values: MovementInsert) {
  const supabase = await createClient();
  return supabase.from("investment_movements").insert(values).select().single();
}

export async function deleteMovement(userId: string, id: string) {
  const supabase = await createClient();
  return supabase.from("investment_movements").delete().eq("user_id", userId).eq("id", id);
}
