import { z } from "zod";

export const eventSchema = z.object({
  title: z.string().min(1, "Il titolo è obbligatorio"),
  description: z.string().optional(),
  eventDate: z.string().min(1, "La data è obbligatoria"),
  eventTime: z.string().optional(),
  eventType: z.enum(["meeting", "reminder", "other"]),
  clientId: z.string().optional(),
  projectId: z.string().optional(),
  taskId: z.string().optional(),
});

export type EventInput = z.infer<typeof eventSchema>;
