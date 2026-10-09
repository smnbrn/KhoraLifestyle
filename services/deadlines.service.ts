import "server-only";

import { createClient } from "@/lib/supabase/server";
import { computeTimeline } from "@/lib/timeline";
import { todayIso } from "@/lib/dates";
import { listOpenPhases } from "@/services/phases.service";
import { listDeadlines } from "@/services/life.service";

// Punto unico da cui calendario, notifiche, Home e dashboard leggono tutte le
// scadenze. Le date "a giorni" (task, progetti, macro attività) vengono
// calcolate qui con computeTimeline: nessuna scadenza è duplicata in una
// tabella, quindi non può andare fuori sincronia quando si congela un tempo.

export type DeadlineType = "task" | "project" | "phase" | "invoice" | "rental" | "vehicle" | "trip";

export type DeadlineItem = {
  id: string;
  type: DeadlineType;
  label: string;
  sublabel?: string;
  date: string;
  href: string;
  overdue: boolean;
  frozen?: boolean;
};

export async function collectDeadlines(userId: string): Promise<DeadlineItem[]> {
  const supabase = await createClient();
  const today = todayIso();

  const [tasksRes, projectsRes, phases, lifeDeadlines, rentalsRes, tripsRes, invoicesRes] = await Promise.all([
    supabase
      .from("tasks")
      .select("id, title, due_date, start_date, duration_days, timeline_running, frozen_since, frozen_days, projects(name)")
      .eq("user_id", userId)
      .neq("status", "completed"),
    supabase
      .from("projects")
      .select("id, name, expected_end_date, start_date, duration_days, timeline_running, frozen_since, frozen_days")
      .eq("user_id", userId)
      .is("archived_at", null)
      .in("status", ["planned", "in_progress", "paused"]),
    listOpenPhases(userId),
    listDeadlines(userId),
    supabase
      .from("rentals")
      .select("id, name, contract_end")
      .eq("user_id", userId)
      .is("archived_at", null)
      .not("contract_end", "is", null),
    supabase
      .from("trips")
      .select("id, name, destination, start_date, status")
      .eq("user_id", userId)
      .not("start_date", "is", null),
    supabase
      .from("invoices")
      .select("id, invoice_number, due_date")
      .eq("user_id", userId)
      .in("status", ["issued", "partially_paid"])
      .not("due_date", "is", null),
  ]);

  const items: DeadlineItem[] = [];

  for (const t of tasksRes.data ?? []) {
    const tl = computeTimeline({ ...t, legacy_end: t.due_date }, today);
    if (!tl.end) continue;
    items.push({
      id: `task-${t.id}`,
      type: "task",
      label: t.title,
      sublabel: t.projects?.name,
      date: tl.end,
      href: "/task",
      overdue: tl.end < today,
      frozen: tl.frozen,
    });
  }

  for (const p of projectsRes.data ?? []) {
    const tl = computeTimeline({ ...p, legacy_end: p.expected_end_date }, today);
    if (!tl.end) continue;
    items.push({
      id: `project-${p.id}`,
      type: "project",
      label: p.name,
      sublabel: "Consegna progetto",
      date: tl.end,
      href: `/progetti/${p.id}`,
      overdue: tl.end < today,
      frozen: tl.frozen,
    });
  }

  for (const ph of phases) {
    const tl = computeTimeline({ ...ph, legacy_end: null }, today);
    if (!tl.end) continue;
    items.push({
      id: `phase-${ph.id}`,
      type: "phase",
      label: ph.name,
      sublabel: ph.projects?.name,
      date: tl.end,
      href: `/progetti/${ph.project_id}`,
      overdue: tl.end < today,
      frozen: tl.frozen,
    });
  }

  for (const d of lifeDeadlines) {
    const isRental = !!d.rental_id;
    items.push({
      id: `${isRental ? "rental" : "vehicle"}-deadline-${d.id}`,
      type: isRental ? "rental" : "vehicle",
      label: d.title,
      sublabel: (isRental ? d.rentals?.name : d.vehicles?.name) ?? undefined,
      date: d.due_date,
      href: isRental ? "/vita/affitti" : "/vita/veicoli",
      overdue: d.due_date < today,
    });
  }

  for (const r of rentalsRes.data ?? []) {
    items.push({
      id: `rental-contract-${r.id}`,
      type: "rental",
      label: "Scadenza contratto",
      sublabel: r.name,
      date: r.contract_end as string,
      href: "/vita/affitti",
      overdue: (r.contract_end as string) < today,
    });
  }

  for (const t of tripsRes.data ?? []) {
    items.push({
      id: `trip-${t.id}`,
      type: "trip",
      label: `Partenza: ${t.name}`,
      sublabel: t.destination ?? undefined,
      date: t.start_date as string,
      href: `/vita/viaggi/${t.id}`,
      overdue: false,
    });
  }

  for (const i of invoicesRes.data ?? []) {
    items.push({
      id: `invoice-${i.id}`,
      type: "invoice",
      label: `Fattura ${i.invoice_number}`,
      date: i.due_date as string,
      href: `/fatture/${i.id}`,
      overdue: (i.due_date as string) < today,
    });
  }

  return items.sort((a, b) => a.date.localeCompare(b.date));
}
