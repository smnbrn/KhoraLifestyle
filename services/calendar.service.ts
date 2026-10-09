import "server-only";

import { createClient } from "@/lib/supabase/server";
import { collectDeadlines, collectRentIncome } from "@/services/deadlines.service";
import { todayIso } from "@/lib/dates";
import type { Database } from "@/types/database.types";

type EventInsert = Database["public"]["Tables"]["events"]["Insert"];

function toISODate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export type CalendarItem = {
  id: string;
  title: string;
  date: string;
  time?: string | null;
  type: "task" | "invoice" | "project" | "phase" | "life" | "trip" | "event";
  subtitle?: string;
  href?: string;
  overdue?: boolean;
  /** completata: resta nel calendario, in verde */
  done: boolean;
  /** done = completata · overdue = scaduta · progress = in corso · upcoming = ancora da iniziare */
  status: CalendarStatus;
  /** si può spuntare "Fatto" / eliminare direttamente dal calendario */
  canComplete: boolean;
  canDelete: boolean;
};

export type CalendarStatus = "done" | "overdue" | "progress" | "upcoming";

// Cosa si può fare dal calendario, in base al tipo di voce (dall'id).
//  - Fatto: task, macro attività, progetto, scadenza vita, viaggio, evento
//  - Elimina: task, macro attività, progetto, viaggio, scadenza vita, evento (le fatture si gestiscono dalla loro pagina)
function capabilities(id: string) {
  const complete = /^(task|phase|project|rental-deadline|vehicle-deadline|trip|event)-/.test(id);
  const del = /^(task|phase|project|trip|rental-deadline|vehicle-deadline|event)-/.test(id);
  return { canComplete: complete, canDelete: del };
}

function statusOf(item: { date: string; done: boolean; overdue?: boolean; start?: string }, today: string): CalendarStatus {
  if (item.done) return "done";
  if (item.overdue) return "overdue";
  if (item.start ? item.start <= today : item.date === today) return "progress";
  return "upcoming";
}

const DEADLINE_TO_CALENDAR = {
  task: "task",
  project: "project",
  phase: "phase",
  invoice: "invoice",
  rental: "life",
  vehicle: "life",
  trip: "trip",
} as const;

// Aggrega tutte le scadenze (task, progetti, macro attività, affitti, veicoli,
// viaggi — calcolate al volo da collectDeadlines, mai duplicate) con gli eventi
// custom creati dall'utente.
export async function getCalendarItems(userId: string, year: number, month: number) {
  const supabase = await createClient();
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const end = toISODate(new Date(Date.UTC(year, month, 1)));

  const [deadlinesBase, rentIncome, eventsRes] = await Promise.all([
    collectDeadlines(userId, { includeCompleted: true }),
    collectRentIncome(userId, start, end),
    supabase
      .from("events")
      .select("id, title, event_date, event_time, completed_at")
      .eq("user_id", userId)
      .gte("event_date", start)
      .lt("event_date", end),
  ]);

  // "Incasso affitto" arriva già mese per mese da collectRentIncome: tolgo la copia
  // "prossimo incasso" di collectDeadlines per non mostrarla due volte.
  const deadlines = [...deadlinesBase.filter((d) => !d.id.startsWith("rental-income-")), ...rentIncome];

  const today = todayIso();

  const items: CalendarItem[] = [
    ...deadlines
      .filter((d) => d.date >= start && d.date < end)
      .map((d) => {
        const done = !!d.done;
        return {
          id: d.id,
          title: d.label,
          subtitle: d.sublabel,
          date: d.date,
          type: DEADLINE_TO_CALENDAR[d.type],
          href: d.href,
          overdue: d.overdue,
          done,
          status: statusOf({ date: d.date, done, overdue: d.overdue, start: d.start }, today),
          ...capabilities(d.id),
        };
      }),
    ...(eventsRes.data ?? []).map((e) => {
      const done = !!e.completed_at;
      return {
        id: `event-${e.id}`,
        title: e.title,
        date: e.event_date,
        time: e.event_time,
        type: "event" as const,
        overdue: !done && e.event_date < today,
        done,
        status: statusOf({ date: e.event_date, done }, today),
        ...capabilities(`event-${e.id}`),
      };
    }),
  ];

  return items;
}

export async function createEvent(values: EventInsert) {
  const supabase = await createClient();
  return supabase.from("events").insert(values).select().single();
}

export async function deleteEvent(userId: string, eventId: string) {
  const supabase = await createClient();
  return supabase.from("events").delete().eq("user_id", userId).eq("id", eventId);
}

export async function setEventDone(userId: string, eventId: string, done: boolean) {
  const supabase = await createClient();
  return supabase
    .from("events")
    .update({ completed_at: done ? new Date().toISOString() : null })
    .eq("user_id", userId)
    .eq("id", eventId);
}
