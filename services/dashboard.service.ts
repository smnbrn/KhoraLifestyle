import "server-only";

import { createClient } from "@/lib/supabase/server";

function toISODate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

// ---------------------------------------------------------------
// KPI: entrate / uscite / profitto del mese corrente
// ---------------------------------------------------------------
export async function getMonthlyFinancialSummary(userId: string) {
  const supabase = await createClient();
  const now = new Date();
  const start = toISODate(startOfMonth(now));
  const end = toISODate(startOfMonth(new Date(now.getFullYear(), now.getMonth() + 1, 1)));

  const { data } = await supabase
    .from("transactions")
    .select("type, amount")
    .eq("user_id", userId)
    .gte("transaction_date", start)
    .lt("transaction_date", end);

  const rows = data ?? [];
  const income = rows.filter((t) => t.type === "income").reduce((sum, t) => sum + Number(t.amount), 0);
  const expenses = rows.filter((t) => t.type === "expense").reduce((sum, t) => sum + Number(t.amount), 0);

  return { income, expenses, profit: income - expenses };
}

// ---------------------------------------------------------------
// KPI: stato fatture — da incassare, scadute (calcolate a runtime), pagate
// ---------------------------------------------------------------
export async function getInvoiceKpis(userId: string) {
  const supabase = await createClient();
  const today = toISODate(new Date());

  const [openResult, paidResult] = await Promise.all([
    supabase
      .from("invoices")
      .select("id, remaining_amount, due_date")
      .eq("user_id", userId)
      .in("status", ["issued", "partially_paid"]),
    supabase
      .from("invoices")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "paid"),
  ]);

  const outstanding = openResult.data ?? [];
  const overdue = outstanding.filter((i) => i.due_date && i.due_date < today);

  return {
    outstandingCount: outstanding.length,
    outstandingAmount: outstanding.reduce((sum, i) => sum + Number(i.remaining_amount), 0),
    overdueCount: overdue.length,
    overdueAmount: overdue.reduce((sum, i) => sum + Number(i.remaining_amount), 0),
    paidCount: paidResult.count ?? 0,
  };
}

// ---------------------------------------------------------------
// KPI: progetti attivi, task aperti, task in scadenza (prossimi 7 giorni)
// ---------------------------------------------------------------
export async function getWorkKpis(userId: string) {
  const supabase = await createClient();
  const in7Days = toISODate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

  const [activeProjects, openTasks, dueSoonTasks] = await Promise.all([
    supabase.from("projects").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("status", "in_progress"),
    supabase.from("tasks").select("id", { count: "exact", head: true }).eq("user_id", userId).neq("status", "completed"),
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .neq("status", "completed")
      .not("due_date", "is", null)
      .lte("due_date", in7Days),
  ]);

  return {
    activeProjects: activeProjects.count ?? 0,
    openTasks: openTasks.count ?? 0,
    dueSoonTasks: dueSoonTasks.count ?? 0,
  };
}

// ---------------------------------------------------------------
// Grafico: entrate/uscite/profitto negli ultimi N mesi.
// Aggregazione fatta qui (non in SQL): PostgREST non espone GROUP BY su
// espressioni come date_trunc, quindi si prendono le righe grezze del
// periodo e si raggruppano lato server Next.js. Per volumi molto grandi,
// in futuro si può sostituire con una vista/funzione Postgres dedicata.
// ---------------------------------------------------------------
export async function getIncomeExpenseTrend(userId: string, months = 6) {
  const supabase = await createClient();
  const now = new Date();
  const start = toISODate(new Date(now.getFullYear(), now.getMonth() - (months - 1), 1));

  const { data } = await supabase
    .from("transactions")
    .select("type, amount, transaction_date")
    .eq("user_id", userId)
    .gte("transaction_date", start);

  const buckets = new Map<string, { income: number; expense: number }>();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.set(monthKey(d), { income: 0, expense: 0 });
  }

  for (const t of data ?? []) {
    const d = new Date(t.transaction_date);
    const key = monthKey(new Date(d.getFullYear(), d.getMonth(), 1));
    const bucket = buckets.get(key);
    if (!bucket) continue;
    if (t.type === "income") bucket.income += Number(t.amount);
    else bucket.expense += Number(t.amount);
  }

  return Array.from(buckets.entries()).map(([key, value]) => ({
    month: key,
    label: new Date(`${key}-01T00:00:00`).toLocaleDateString("it-IT", { month: "short" }),
    entrate: Math.round(value.income * 100) / 100,
    uscite: Math.round(value.expense * 100) / 100,
    profitto: Math.round((value.income - value.expense) * 100) / 100,
  }));
}

// ---------------------------------------------------------------
// Grafico: distribuzione progetti per stato
// ---------------------------------------------------------------
const PROJECT_STATUS_LABELS: Record<string, string> = {
  planned: "Pianificato",
  in_progress: "In corso",
  paused: "In pausa",
  completed: "Completato",
  cancelled: "Annullato",
};

export async function getProjectStatusDistribution(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("projects").select("status").eq("user_id", userId);

  const counts = new Map<string, number>();
  for (const p of data ?? []) {
    counts.set(p.status, (counts.get(p.status) ?? 0) + 1);
  }

  return Object.entries(PROJECT_STATUS_LABELS)
    .map(([status, label]) => ({ status, label, count: counts.get(status) ?? 0 }))
    .filter((entry) => entry.count > 0);
}

// ---------------------------------------------------------------
// Liste: ultime fatture, pagamenti recenti, prossime scadenze, task urgenti
// ---------------------------------------------------------------
export async function getRecentInvoices(userId: string, limit = 5) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("invoices")
    .select("id, invoice_number, total, status, issue_date, clients(name)")
    .eq("user_id", userId)
    .order("issue_date", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function getRecentPayments(userId: string, limit = 5) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("payments")
    .select("id, amount, payment_date, invoices(invoice_number)")
    .eq("user_id", userId)
    .order("payment_date", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export type UpcomingDeadline = { type: "task" | "invoice"; id: string; label: string; date: string };

export async function getUpcomingDeadlines(userId: string, limit = 6): Promise<UpcomingDeadline[]> {
  const supabase = await createClient();
  const today = toISODate(new Date());

  const [taskResult, invoiceResult] = await Promise.all([
    supabase
      .from("tasks")
      .select("id, title, due_date")
      .eq("user_id", userId)
      .neq("status", "completed")
      .not("due_date", "is", null)
      .gte("due_date", today)
      .order("due_date", { ascending: true })
      .limit(limit),
    supabase
      .from("invoices")
      .select("id, invoice_number, due_date")
      .eq("user_id", userId)
      .in("status", ["issued", "partially_paid"])
      .not("due_date", "is", null)
      .gte("due_date", today)
      .order("due_date", { ascending: true })
      .limit(limit),
  ]);

  const combined: UpcomingDeadline[] = [
    ...(taskResult.data ?? []).map((t) => ({
      type: "task" as const,
      id: t.id,
      label: t.title,
      date: t.due_date as string,
    })),
    ...(invoiceResult.data ?? []).map((i) => ({
      type: "invoice" as const,
      id: i.id,
      label: `Fattura ${i.invoice_number}`,
      date: i.due_date as string,
    })),
  ];

  return combined.sort((a, b) => a.date.localeCompare(b.date)).slice(0, limit);
}

export async function getUrgentTasks(userId: string, limit = 5) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tasks")
    .select("id, title, priority, due_date")
    .eq("user_id", userId)
    .neq("status", "completed")
    .in("priority", ["urgent", "high"])
    .order("due_date", { ascending: true, nullsFirst: false })
    .limit(limit);
  return data ?? [];
}

export type ActivityEntry = { id: string; description: string; date: string };

export async function getRecentActivity(userId: string, limit = 8): Promise<ActivityEntry[]> {
  const supabase = await createClient();

  const [invoiceResult, paymentResult, taskResult] = await Promise.all([
    supabase
      .from("invoices")
      .select("id, invoice_number, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase
      .from("payments")
      .select("id, amount, created_at, invoices(invoice_number)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase
      .from("tasks")
      .select("id, title, updated_at")
      .eq("user_id", userId)
      .eq("status", "completed")
      .order("updated_at", { ascending: false })
      .limit(limit),
  ]);

  const combined: ActivityEntry[] = [
    ...(invoiceResult.data ?? []).map((i) => ({
      id: `invoice-${i.id}`,
      description: `Fattura ${i.invoice_number} creata`,
      date: i.created_at as string,
    })),
    ...(paymentResult.data ?? []).map((p) => ({
      id: `payment-${p.id}`,
      description: `Pagamento ricevuto${p.invoices ? ` — fattura ${p.invoices.invoice_number}` : ""}`,
      date: p.created_at as string,
    })),
    ...(taskResult.data ?? []).map((t) => ({
      id: `task-${t.id}`,
      description: `Task "${t.title}" completato`,
      date: t.updated_at as string,
    })),
  ];

  return combined.sort((a, b) => b.date.localeCompare(a.date)).slice(0, limit);
}
