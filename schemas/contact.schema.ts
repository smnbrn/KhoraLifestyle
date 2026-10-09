import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().min(1, "Il nome è obbligatorio"),
  kind: z.enum(["client", "collaborator", "supplier", "other"]),
  company: z.string().optional(),
  role: z.string().optional(),
  email: z.string().email("Email non valida").optional().or(z.literal("")),
  phone: z.string().optional(),
  clientId: z.string().optional(),
  notes: z.string().optional(),
});

export type ContactInput = z.infer<typeof contactSchema>;
