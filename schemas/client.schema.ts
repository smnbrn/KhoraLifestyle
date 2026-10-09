import { z } from "zod";

export const clientSchema = z.object({
  name: z.string().min(1, "Il nome è obbligatorio"),
  referentName: z.string().optional(),
  email: z.string().email("Email non valida").optional().or(z.literal("")),
  phone: z.string().optional(),
  vatNumber: z.string().optional(),
  taxCode: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  province: z.string().optional(),
  country: z.string().optional(),
  notes: z.string().optional(),
});

export type ClientInput = z.infer<typeof clientSchema>;
