import { addDays, diffDays, todayIso } from "@/lib/dates";

// Tempo "a giorni" per progetti, task e macro attività.
//
//   fine = inizio + durata (giorni) + giorni congelati
//
// L'utente sceglie una data di inizio e un numero di giorni; un interruttore
// dice se i giorni "scorrono" o sono "congelati". Finché è congelato, ogni
// giorno che passa sposta in avanti la scadenza di un giorno (il tempo di
// lavoro non avanza). Quando riparte, i giorni di blocco vengono sommati a
// `frozen_days`. Un'unica implementazione: la UI, il calendario, le notifiche
// e il Gantt usano tutti queste funzioni.

export type TimelineFields = {
  start_date: string | null;
  duration_days: number | null;
  timeline_running: boolean;
  frozen_since: string | null;
  frozen_days: number;
  /** Scadenza "a data fissa" dei dati precedenti al passaggio ai giorni (fallback). */
  legacy_end?: string | null;
};

export type Timeline = {
  /** true se la scadenza deriva da inizio + giorni */
  hasDuration: boolean;
  start: string | null;
  end: string | null;
  durationDays: number | null;
  frozen: boolean;
  /** giorni di blocco totali (già chiusi + quello in corso) */
  frozenTotal: number;
  /** giorni di lavoro effettivamente trascorsi (mai oltre la durata) */
  elapsedDays: number;
  /** 0-100: scorrimento del tempo */
  timePercent: number;
  /** giorni di calendario da oggi alla fine (negativo = in ritardo) */
  daysToEnd: number | null;
  notStarted: boolean;
};

export function computeTimeline(f: TimelineFields, today: string = todayIso()): Timeline {
  const hasDuration = !!f.start_date && f.duration_days != null;
  const frozen = !f.timeline_running;
  const currentFreeze = frozen && f.frozen_since ? Math.max(0, diffDays(today, f.frozen_since)) : 0;
  const frozenTotal = f.frozen_days + currentFreeze;

  if (hasDuration) {
    const start = f.start_date as string;
    const duration = f.duration_days as number;
    const end = addDays(start, duration + frozenTotal);
    const rawElapsed = diffDays(today, start) - frozenTotal;
    const elapsed = Math.min(duration, Math.max(0, rawElapsed));
    const timePercent = duration > 0 ? Math.round((elapsed / duration) * 100) : today >= start ? 100 : 0;
    return {
      hasDuration: true,
      start,
      end,
      durationDays: duration,
      frozen,
      frozenTotal,
      elapsedDays: elapsed,
      timePercent,
      daysToEnd: diffDays(end, today),
      notStarted: today < start,
    };
  }

  // Fallback: dati vecchi con una sola data di scadenza
  const end = f.legacy_end ?? null;
  let timePercent = 0;
  let elapsed = 0;
  let duration: number | null = null;
  if (f.start_date && end && end > f.start_date) {
    duration = diffDays(end, f.start_date);
    elapsed = Math.min(duration, Math.max(0, diffDays(today, f.start_date)));
    timePercent = Math.round((elapsed / duration) * 100);
  }
  return {
    hasDuration: false,
    start: f.start_date,
    end,
    durationDays: duration,
    frozen,
    frozenTotal,
    elapsedDays: elapsed,
    timePercent,
    daysToEnd: end ? diffDays(end, today) : null,
    notStarted: !!f.start_date && today < f.start_date,
  };
}

/** Nuovi valori dei campi quando si sposta l'interruttore scorre/congelato. */
export function toggleTimeline(
  f: Pick<TimelineFields, "timeline_running" | "frozen_since" | "frozen_days">,
  running: boolean,
  today: string = todayIso()
): Pick<TimelineFields, "timeline_running" | "frozen_since" | "frozen_days"> {
  if (running === f.timeline_running) return { ...f };
  if (running) {
    // riparte: chiudo il periodo di blocco e lo sommo
    const closed = f.frozen_since ? Math.max(0, diffDays(today, f.frozen_since)) : 0;
    return { timeline_running: true, frozen_since: null, frozen_days: f.frozen_days + closed };
  }
  return { timeline_running: false, frozen_since: today, frozen_days: f.frozen_days };
}

/** Anteprima nel form: data di fine da inizio + giorni (senza blocchi). */
export function previewEnd(start: string | undefined, days: string | number | undefined): string | null {
  if (!start || days === undefined || days === "") return null;
  const n = Number(days);
  if (!Number.isFinite(n) || n < 0) return null;
  return addDays(start, Math.floor(n));
}
