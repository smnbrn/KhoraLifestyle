import { z } from "zod";

export const profileSchema = z.object({
  fullName: z.string().min(2, "Inserisci nome e cognome"),
  companyName: z.string().optional(),
  vatNumber: z.string().optional(),
  taxCode: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  province: z.string().optional(),
  country: z.string().min(1, "Campo obbligatorio"),
  phone: z.string().optional(),
  defaultVatRate: z.coerce.number().min(0, "Non può essere negativa").max(100, "Non può superare 100"),
  invoiceNumberPrefix: z.string().optional(),
  quoteNumberPrefix: z.string().optional(),
});

export type ProfileInput = z.infer<typeof profileSchema>;
