import { z } from "zod";

// Campi "tempo a giorni" condivisi da progetti e task.
export const timelineShape = {
  startDate: z.string().optional(),
  durationDays: z
    .string()
    .optional()
    .refine((v) => !v || /^\d{1,5}$/.test(v.trim()), "Inserisci un numero intero di giorni"),
  timelineRunning: z.boolean(),
};

export type TimelineFormValues = {
  startDate?: string;
  durationDays?: string;
  timelineRunning: boolean;
};
