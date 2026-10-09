import { z } from "zod";

export const phaseSchema = z.object({
  name: z.string().min(1, "Il nome è obbligatorio"),
  startDate: z.string().min(1, "Imposta la data di inizio"),
  durationDays: z.string().regex(/^\d{1,5}$/, "Inserisci un numero intero di giorni").refine((v) => Number(v) >= 1, "Almeno 1 giorno"),
});

export type PhaseInput = z.infer<typeof phaseSchema>;
