import "server-only";

import { createClient } from "@/lib/supabase/server";

export type ReportFilters = {
  start: string;
  end: string;
  clientId?: string;
  projectId?: string;
  categoryId?: string;
};

export async function getFinancialOverview(userId: string, filters: ReportFilters) {
  const supabase = await createClient();

  let txQuery = supabase
    .from("transactions")
    .select("type, amount")
    .eq("user_id", userId)
    .gte("transaction_date", filters.start)
    .lte("transaction_date", filters.end);
  if (filters.clientId) txQuery = txQuery.eq("client_id", filters.clientId);
  if (filters.projectId) txQuery = txQuery.eq("project_id", filters.projectId);
  if (filters.categoryId) txQuery = txQuery.eq("category_id", filters.categoryId);

  let invoiceQuery = supabase
    .from("invoices")
    .select("total")
    .eq("user_id", userId)
    .neq("status", "cancelled")
    .gte("issue_date", filters.start)
    .lte("issue_date", filters.end);
  if (filters.clientId) invoiceQuery = invoiceQuery.eq("client_id", filters.clientId);
  if (filters.projectId) invoiceQuery = invoiceQuery.eq("project_id", filters.projectId);

  const [txResult, invoiceResult] = await Promise.all([txQuery, invoiceQuery]);

  const rows = txResult.data ?? [];
  const income = rows.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const expenses = rows.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
  const fatturato = (invoiceResult.data ?? []).reduce((s, i) => s + Number(i.total), 0);

  return { fatturato, income, expenses, profit: income - expenses };
}

export async function getInvoiceStatusBreakdown(userId: string, filters: ReportFilters) {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  let query = supabase
    .from("invoices")
    .select("status, total, due_date")
    .eq("user_id", userId)
    .gte("issue_date", filters.start)
    .lte("issue_date", filters.end);
  if (filters.clientId) query = query.eq("client_id", filters.clientId);
  if (filters.projectId) query = query.eq("project_id", filters.projectId);

  const { data } = await query;
  const rows = data ?? [];

  const paid = rows.filter((i) => i.status === "paid");
  const unpaid = rows.filter((i) => i.status === "issued" || i.status === "partially_paid");
  const overdue = unpaid.filter((i) => i.due_date && i.due_date < today);

  const sum = (list: typeof rows) => list.reduce((s, i) => s + Number(i.total), 0);

  return {
    paid: { count: paid.length, amount: sum(paid) },
    unpaid: { count: unpaid.length, amount: sum(unpaid) },
    overdue: { count: overdue.length, amount: sum(overdue) },
  };
}

export async function getProjectProfitability(userId: string, filters: ReportFilters) {
  const supabase = await createClient();

  let projectsQuery = supabase
    .from("projects")
    .select("id, name, project_value")
    .eq("user_id", userId);
  if (filters.projectId) projectsQuery = projectsQuery.eq("id", filters.projectId);
  if (filters.clientId) projectsQuery = projectsQuery.eq("client_id", filters.clientId);

  const { data: projects } = await projectsQuery;
  if (!projects || projects.length === 0) return [];

  const { data: costRows } = await supabase
    .from("transactions")
    .select("project_id, amount")
    .eq("user_id", userId)
    .eq("type", "expense")
    .gte("transaction_date", filters.start)
    .lte("transaction_date", filters.end)
    .in("project_id", projects.map((p) => p.id));

  const costsByProject = new Map<string, number>();
  for (const row of costRows ?? []) {
    if (!row.project_id) continue;
    costsByProject.set(row.project_id, (costsByProject.get(row.project_id) ?? 0) + Number(row.amount));
  }

  return projects
    .map((p) => {
      const costs = costsByProject.get(p.id) ?? 0;
      return { id: p.id, name: p.name, value: Number(p.project_value), costs, profit: Number(p.project_value) - costs };
    })
    .sort((a, b) => b.profit - a.profit);
}

export async function getIncomeByClient(userId: string, filters: ReportFilters) {
  const supabase = await createClient();

  let query = supabase
    .from("transactions")
    .select("client_id, amount, clients(name)")
    .eq("user_id", userId)
    .eq("type", "income")
    .not("client_id", "is", null)
    .gte("transaction_date", filters.start)
    .lte("transaction_date", filters.end);
  if (filters.clientId) query = query.eq("client_id", filters.clientId);

  const { data } = await query;
  const rows = data ?? [];

  const byClient = new Map<string, { name: string; total: number }>();
  for (const row of rows) {
    if (!row.client_id) continue;
    const existing = byClient.get(row.client_id);
    const name = (row.clients as { name: string } | null)?.name ?? "—";
    if (existing) {
      existing.total += Number(row.amount);
    } else {
      byClient.set(row.client_id, { name, total: Number(row.amount) });
    }
  }

  return Array.from(byClient.entries())
    .map(([clientId, v]) => ({ clientId, ...v }))
    .sort((a, b) => b.total - a.total);
}

/** Andamento mensile entrate/uscite nell'intervallo scelto — per il grafico. */
export async function getPeriodTrend(userId: string, filters: ReportFilters) {
  const supabase = await createClient();

  let query = supabase
    .from("transactions")
    .select("type, amount, transaction_date")
    .eq("user_id", userId)
    .gte("transaction_date", filters.start)
    .lte("transaction_date", filters.end);
  if (filters.clientId) query = query.eq("client_id", filters.clientId);
  if (filters.projectId) query = query.eq("project_id", filters.projectId);
  if (filters.categoryId) query = query.eq("category_id", filters.categoryId);

  const { data } = await query;

  const buckets = new Map<string, { income: number; expense: number }>();
  for (const t of data ?? []) {
    const d = new Date(t.transaction_date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const bucket = buckets.get(key) ?? { income: 0, expense: 0 };
    if (t.type === "income") bucket.income += Number(t.amount);
    else bucket.expense += Number(t.amount);
    buckets.set(key, bucket);
  }

  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => ({
      label: new Date(`${key}-01T00:00:00`).toLocaleDateString("it-IT", { month: "short", year: "2-digit" }),
      entrate: Math.round(value.income * 100) / 100,
      uscite: Math.round(value.expense * 100) / 100,
    }));
}
