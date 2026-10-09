// Calcolo degli intervalli di data per i periodi richiesti dalla sezione 15
// (Report). Tutte le date sono stringhe ISO "YYYY-MM-DD", confrontabili
// direttamente nelle query (vedi nota sulle date in services/).

export type PeriodKey =
  | "questo-mese"
  | "mese-precedente"
  | "questo-trimestre"
  | "questo-anno"
  | "anno-precedente"
  | "sempre"
  | "personalizzato";

export const PERIOD_LABELS: Record<PeriodKey, string> = {
  "questo-mese": "Questo mese",
  "mese-precedente": "Mese precedente",
  "questo-trimestre": "Questo trimestre",
  "questo-anno": "Quest'anno",
  "anno-precedente": "Anno precedente",
  sempre: "Sempre",
  personalizzato: "Personalizzato",
};

function iso(date: Date) {
  return date.toISOString().slice(0, 10);
}

/** "Sempre": da prima di qualsiasi dato registrato fino a oggi. */
export const ALWAYS_START = "1900-01-01";

export function resolvePeriod(
  period: string | undefined,
  customStart?: string,
  customEnd?: string
): { start: string; end: string; key: PeriodKey } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  switch (period) {
    case "mese-precedente": {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0);
      return { start: iso(start), end: iso(end), key: "mese-precedente" };
    }
    case "questo-trimestre": {
      const quarterStartMonth = Math.floor(month / 3) * 3;
      const start = new Date(year, quarterStartMonth, 1);
      return { start: iso(start), end: iso(now), key: "questo-trimestre" };
    }
    case "questo-anno": {
      return { start: `${year}-01-01`, end: iso(now), key: "questo-anno" };
    }
    case "anno-precedente": {
      return { start: `${year - 1}-01-01`, end: `${year - 1}-12-31`, key: "anno-precedente" };
    }
    case "sempre": {
      return { start: ALWAYS_START, end: iso(now), key: "sempre" };
    }
    case "personalizzato": {
      return {
        start: customStart || iso(new Date(year, month, 1)),
        end: customEnd || iso(now),
        key: "personalizzato",
      };
    }
    case "questo-mese":
    default: {
      const start = new Date(year, month, 1);
      return { start: iso(start), end: iso(now), key: "questo-mese" };
    }
  }
}
