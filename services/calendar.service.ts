import "server-only";

import { createClient } from "@/lib/supabase/server";
import { collectDeadlines } from "@/services/deadlines.service";
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
};

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

  const [deadlines, eventsRes] = await Promise.all([
    collectDeadlines(userId),
    supabase
      .from("events")
      .select("id, title, event_date, event_time")
      .eq("user_id", userId)
      .gte("event_date", start)
      .lt("event_date", end),
  ]);

  const items: CalendarItem[] = [
    ...deadlines
      .filter((d) => d.date >= start && d.date < end)
      .map((d) => ({
        id: d.id,
        title: d.label,
        subtitle: d.sublabel,
        date: d.date,
        type: DEADLINE_TO_CALENDAR[d.type],
        href: d.href,
        overdue: d.overdue,
      })),
    ...(eventsRes.data ?? []).map((e) => ({
      id: `event-${e.id}`,
      title: e.title,
      date: e.event_date,
      time: e.event_time,
      type: "event" as const,
    })),
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
