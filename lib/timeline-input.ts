import { todayIso } from "@/lib/dates";
import { computeTimeline, toggleTimeline } from "@/lib/timeline";

type ExistingState = {
  duration_days: number | null;
  timeline_running: boolean;
  frozen_since: string | null;
  frozen_days: number;
};

export type TimelineDbValues = {
  start_date: string | null;
  duration_days: number | null;
  timeline_running: boolean;
  frozen_since: string | null;
  frozen_days: number;
};

/**
 * Traduce i campi del form (inizio, giorni, interruttore) nei valori del DB,
 * tenendo conto dello stato di blocco già registrato: se si passa da
 * "scorre" a "congelato" parte il conteggio dei giorni di blocco, se si
 * riparte i giorni di blocco vengono sommati. Ritorna anche la data di fine
 * calcolata, da salvare come istantanea nella vecchia colonna di scadenza.
 */
export function buildTimelineValues(
  input: { startDate?: string; durationDays?: string; timelineRunning: boolean },
  existing: ExistingState | null,
  today: string = todayIso()
): { error: string } | { values: TimelineDbValues; end: string | null; clearedDuration: boolean } {
  const start = input.startDate?.trim() ? input.startDate.trim() : null;
  const days = input.durationDays?.trim() ? Number(input.durationDays.trim()) : null;

  if (days != null && !start) return { error: "Per calcolare la scadenza imposta anche la data di inizio." };

  const base = existing ?? { timeline_running: true, frozen_since: null, frozen_days: 0 };
  const toggled = toggleTimeline(base, input.timelineRunning, today);

  const values: TimelineDbValues = { start_date: start, duration_days: days, ...toggled };
  const end =
    days != null && start
      ? computeTimeline({ ...values, legacy_end: null }, today).end
      : null;

  return { values, end, clearedDuration: days == null && existing?.duration_days != null };
}
