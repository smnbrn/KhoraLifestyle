import { z } from "zod";
import { quoteItemSchema } from "./quote.schema";

export const invoiceSchema = z.object({
  clientId: z.string().min(1, "Seleziona un cliente"),
  projectId: z.string().optional(),
  quoteId: z.string().optional(),
  issueDate: z.string().min(1, "Data obbligatoria"),
  dueDate: z.string().optional(),
  status: z.enum(["draft", "issued", "partially_paid", "paid", "overdue", "cancelled"]),
  notes: z.string().optional(),
  items: z.array(quoteItemSchema).min(1, "Aggiungi almeno una riga"),
});

export type InvoiceInput = z.infer<typeof invoiceSchema>;

export const paymentSchema = z.object({
  amount: z.string().min(1, "Importo obbligatorio"),
  paymentDate: z.string().min(1, "Data obbligatoria"),
  paymentMethod: z.enum(["bank_transfer", "card", "cash", "paypal", "other"]),
  notes: z.string().optional(),
});

export type PaymentInput = z.infer<typeof paymentSchema>;
