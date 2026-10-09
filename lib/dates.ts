// Utility per date "pure" (YYYY-MM-DD, senza orario). Tutta l'aritmetica passa
// da un numero-di-giorno UTC: niente problemi di fuso orario o ora legale, che
// con new Date("2026-03-29") + 24h in locale darebbero risultati sbagliati.

const MS_PER_DAY = 86_400_000;

/** "YYYY-MM-DD" → numero di giorni dall'epoca (UTC). */
export function dayNumber(iso: string): number {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / MS_PER_DAY);
}

/** numero di giorni dall'epoca → "YYYY-MM-DD". */
export function fromDayNumber(n: number): string {
  return new Date(n * MS_PER_DAY).toISOString().slice(0, 10);
}

export function addDays(iso: string, days: number): string {
  return fromDayNumber(dayNumber(iso) + days);
}

/** Differenza in giorni di calendario: a - b. */
export function diffDays(a: string, b: string): number {
  return dayNumber(a) - dayNumber(b);
}

/**
 * Oggi come "YYYY-MM-DD" nel fuso orario italiano. Il server può girare in UTC:
 * senza questo, tra mezzanotte e le 1-2 di notte "oggi" sarebbe ancora ieri.
 */
export function todayIso(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Rome" }).format(new Date());
}

export function currentYear(): number {
  return Number(todayIso().slice(0, 4));
}

/** Aggiunge N mesi mantenendo il giorno (con clamp a fine mese: 31 gen + 1 mese = 28/29 feb). */
export function addMonths(iso: string, months: number): string {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  const total = y * 12 + (m - 1) + months;
  const ny = Math.floor(total / 12);
  const nm = total % 12;
  const lastDay = new Date(Date.UTC(ny, nm + 1, 0)).getUTCDate();
  return `${ny}-${String(nm + 1).padStart(2, "0")}-${String(Math.min(d, lastDay)).padStart(2, "0")}`;
}

/** Sovrapposizione inclusiva in giorni tra [aStart,aEnd] e [bStart,bEnd]. */
export function overlapDays(aStart: string, aEnd: string, bStart: string, bEnd: string): number {
  const start = Math.max(dayNumber(aStart), dayNumber(bStart));
  const end = Math.min(dayNumber(aEnd), dayNumber(bEnd));
  return Math.max(0, end - start + 1);
}
