import { RENT_FREQUENCY_MONTHS } from "@/lib/constants/second-brain";

// Date di incasso dell'affitto: "il giorno X del mese".
//
//   - mensile:      ogni mese
//   - trimestrale:  ogni 3 mesi, a partire dal mese di inizio contratto (gennaio se manca)
//   - annuale:      una volta l'anno, nel mese di inizio contratto (gennaio se manca)
//
// Se il giorno non esiste nel mese (es. 31 in febbraio) si usa l'ultimo giorno del mese.
// Gli incassi cadono solo dentro il periodo del contratto, se è indicato.

type RentLike = {
  rent_day: number | null;
  rent_frequency: string;
  contract_start: string | null;
  contract_end: string | null;
};

const pad = (n: number) => String(n).padStart(2, "0");

/** Date "YYYY-MM-DD" di incasso comprese tra `start` e `end` (estremi inclusi), in ordine. */
export function rentOccurrencesInRange(rental: RentLike, start: string, end: string): string[] {
  if (!rental.rent_day || start > end) return [];
  const step = RENT_FREQUENCY_MONTHS[rental.rent_frequency as keyof typeof RENT_FREQUENCY_MONTHS] ?? 1;
  // mese di riferimento per trimestrale / annuale (0-11)
  const anchorMonth = rental.contract_start ? Number(rental.contract_start.slice(5, 7)) - 1 : 0;

  const out: string[] = [];
  let year = Number(start.slice(0, 4));
  let month = Number(start.slice(5, 7)) - 1;
  const endYear = Number(end.slice(0, 4));
  const endMonth = Number(end.slice(5, 7)) - 1;

  while (year < endYear || (year === endYear && month <= endMonth)) {
    const inCycle = step === 1 || (((month - anchorMonth) % step) + step) % step === 0;
    if (inCycle) {
      const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
      const date = `${year}-${pad(month + 1)}-${pad(Math.min(rental.rent_day, lastDay))}`;
      const insideContract =
        (!rental.contract_start || date >= rental.contract_start) && (!rental.contract_end || date <= rental.contract_end);
      if (date >= start && date <= end && insideContract) out.push(date);
    }
    month += 1;
    if (month > 11) {
      month = 0;
      year += 1;
    }
  }
  return out;
}
