import "server-only";

import { createClient } from "@/lib/supabase/server";
import { computeTimeline } from "@/lib/timeline";
import { addDays, todayIso } from "@/lib/dates";
import { rentOccurrencesInRange } from "@/lib/rent";
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
  /** già completata / pagata / fatta (c'è solo con includeCompleted) */
  done?: boolean;
  /** data di inizio, se la scadenza ha un tempo "a giorni": serve a capire se è "in corso" */
  start?: string;
};

/**
 * Tutte le scadenze APERTE (default: usato da notifiche, Home e contatori).
 * Con `includeCompleted` ci sono anche quelle completate, marcate `done`: le usa il calendario,
 * che le deve continuare a mostrare (in verde).
 */
export async function collectDeadlines(
  userId: string,
  options: { includeCompleted?: boolean } = {}
): Promise<DeadlineItem[]> {
  const includeCompleted = !!options.includeCompleted;
  const supabase = await createClient();
  const today = todayIso();

  let tasksQuery = supabase
    .from("tasks")
    .select("id, title, status, due_date, start_date, duration_days, timeline_running, frozen_since, frozen_days, projects(name)")
    .eq("user_id", userId);
  if (!includeCompleted) tasksQuery = tasksQuery.neq("status", "completed");

  const [tasksRes, projectsRes, phases, lifeDeadlines, rentalsRes, tripsRes, invoicesRes] = await Promise.all([
    tasksQuery,
    supabase
      .from("projects")
      .select("id, name, status, expected_end_date, start_date, duration_days, timeline_running, frozen_since, frozen_days")
      .eq("user_id", userId)
      .is("archived_at", null)
      .in("status", includeCompleted ? ["planned", "in_progress", "paused", "completed"] : ["planned", "in_progress", "paused"]),
    listOpenPhases(userId, includeCompleted),
    listDeadlines(userId, {}, includeCompleted),
    supabase
      .from("rentals")
      .select("id, name, contract_start, contract_end, rent_day, rent_frequency, rent_amount")
      .eq("user_id", userId)
      .is("archived_at", null),
    supabase
      .from("trips")
      .select("id, name, destination, start_date, status")
      .eq("user_id", userId)
      .not("start_date", "is", null),
    supabase
      .from("invoices")
      .select("id, invoice_number, due_date, status")
      .eq("user_id", userId)
      .in("status", includeCompleted ? ["issued", "partially_paid", "paid"] : ["issued", "partially_paid"])
      .not("due_date", "is", null),
  ]);

  const items: DeadlineItem[] = [];

  for (const t of tasksRes.data ?? []) {
    const tl = computeTimeline({ ...t, legacy_end: t.due_date }, today);
    const done = t.status === "completed";
    if (!tl.end) {
      // Task con la sola data di inizio (niente durata, niente scadenza): non è una scadenza,
      // quindi resta fuori da notifiche e contatori, ma il calendario la mostra il giorno di inizio.
      if (includeCompleted && t.start_date) {
        items.push({
          id: `task-${t.id}`,
          type: "task",
          label: t.title,
          sublabel: ["Inizio", t.projects?.name].filter(Boolean).join(" · "),
          date: t.start_date,
          href: "/task",
          overdue: false,
          done,
          start: t.start_date,
        });
      }
      continue;
    }
    items.push({
      id: `task-${t.id}`,
      type: "task",
      label: t.title,
      sublabel: t.projects?.name,
      date: tl.end,
      href: "/task",
      overdue: !done && tl.end < today,
      frozen: tl.frozen,
      done,
      start: tl.start ?? undefined,
    });
  }

  for (const p of projectsRes.data ?? []) {
    const tl = computeTimeline({ ...p, legacy_end: p.expected_end_date }, today);
    if (!tl.end) continue;
    const done = p.status === "completed";
    items.push({
      id: `project-${p.id}`,
      type: "project",
      label: p.name,
      sublabel: "Consegna progetto",
      date: tl.end,
      href: `/progetti/${p.id}`,
      overdue: !done && tl.end < today,
      frozen: tl.frozen,
      done,
      start: tl.start ?? undefined,
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
      overdue: !ph.completed && tl.end < today,
      frozen: tl.frozen,
      done: ph.completed,
      start: tl.start ?? undefined,
    });
  }

  for (const d of lifeDeadlines) {
    const isRental = !!d.rental_id;
    // stesso calcolo dei progetti: inizio + giorni + giorni congelati (se non c'è, vale la data fissa)
    const tl = computeTimeline({ ...d, legacy_end: d.due_date }, today);
    const date = tl.end ?? d.due_date;
    const done = !!d.completed_at;
    items.push({
      id: `${isRental ? "rental" : "vehicle"}-deadline-${d.id}`,
      type: isRental ? "rental" : "vehicle",
      label: d.title,
      sublabel: (isRental ? d.rentals?.name : d.vehicles?.name) ?? undefined,
      date,
      href: isRental ? "/vita/affitti" : "/vita/veicoli",
      overdue: !done && date < today,
      frozen: tl.hasDuration ? tl.frozen : undefined,
      done,
      start: tl.hasDuration ? (tl.start ?? undefined) : undefined,
    });
  }

  for (const r of rentalsRes.data ?? []) {
    if (r.contract_end) {
      items.push({
        id: `rental-contract-${r.id}`,
        type: "rental",
        label: "Scadenza contratto",
        sublabel: r.name,
        date: r.contract_end,
        href: "/vita/affitti",
        overdue: r.contract_end < today,
      });
    }
    // prossimo incasso dell'affitto (giorno del mese scelto): solo il prossimo, da oggi in poi
    if (r.rent_day) {
      const next = rentOccurrencesInRange(r, today, addDays(today, 400))[0];
      if (next) {
        items.push({
          id: `rental-income-${r.id}-${next}`,
          type: "rental",
          label: "Incasso affitto",
          sublabel: r.name,
          date: next,
          href: "/vita/affitti",
          overdue: false,
        });
      }
    }
  }

  for (const t of tripsRes.data ?? []) {
    const done = t.status === "done";
    // fuori dal calendario un viaggio già fatto non è più una scadenza
    if (done && !includeCompleted) continue;
    items.push({
      id: `trip-${t.id}`,
      type: "trip",
      label: `Partenza: ${t.name}`,
      sublabel: t.destination ?? undefined,
      date: t.start_date as string,
      href: `/vita/viaggi/${t.id}`,
      overdue: false,
      done,
    });
  }

  for (const i of invoicesRes.data ?? []) {
    items.push({
      id: `invoice-${i.id}`,
      type: "invoice",
      label: `Fattura ${i.invoice_number}`,
      date: i.due_date as string,
      href: `/fatture/${i.id}`,
      overdue: i.status !== "paid" && (i.due_date as string) < today,
      done: i.status === "paid",
    });
  }

  return items.sort((a, b) => a.date.localeCompare(b.date));
}

/** Incassi dell'affitto (giorno del mese) che cadono in [start, end): per il calendario mensile. */
export async function collectRentIncome(userId: string, start: string, end: string): Promise<DeadlineItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("rentals")
    .select("id, name, contract_start, contract_end, rent_day, rent_frequency, rent_amount")
    .eq("user_id", userId)
    .is("archived_at", null)
    .not("rent_day", "is", null);

  const items: DeadlineItem[] = [];
  for (const r of data ?? []) {
    for (const date of rentOccurrencesInRange(r, start, addDays(end, -1))) {
      items.push({
        id: `rental-income-${r.id}-${date}`,
        type: "rental",
        label: "Incasso affitto",
        sublabel: r.name,
        date,
        href: "/vita/affitti",
        overdue: false,
      });
    }
  }
  return items;
}
