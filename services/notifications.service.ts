import "server-only";

import { addDays, todayIso } from "@/lib/dates";
import { collectDeadlines, type DeadlineType } from "@/services/deadlines.service";

export type Notification = {
  id: string;
  type: DeadlineType;
  label: string;
  date: string;
  overdue: boolean;
  href: string;
};

const LOOKAHEAD_DAYS = 7;

/**
 * Notifiche interne: calcolate al volo da scadenze reali (task, progetti,
 * macro attività, affitti, veicoli, viaggi), non salvate in una tabella
 * dedicata — coerente con lo stato "scaduta" delle fatture e col Calendario.
 */
export async function getNotifications(userId: string): Promise<Notification[]> {
  const today = todayIso();
  const horizon = addDays(today, LOOKAHEAD_DAYS);
  const all = await collectDeadlines(userId);

  return all
    .filter((d) => d.date <= horizon)
    // un viaggio già partito non è più una notifica
    .filter((d) => d.type !== "trip" || d.date >= today)
    .map((d) => ({
      id: d.id,
      type: d.type,
      label: d.sublabel && d.type !== "project" ? `${d.label} — ${d.sublabel}` : d.label,
      date: d.date,
      overdue: d.overdue,
      href: d.href,
    }))
    .sort((a, b) => {
      if (a.overdue !== b.overdue) return a.overdue ? -1 : 1;
      return a.date.localeCompare(b.date);
    });
}
