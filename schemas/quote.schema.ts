import { z } from "zod";

export const quoteItemSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(1, "Descrizione obbligatoria"),
  quantity: z.string().min(1, "Obbligatoria"),
  unitPrice: z.string().min(1, "Obbligatorio"),
  discountPercent: z.string().optional(),
  vatRate: z.string().optional(),
});

export const quoteSchema = z.object({
  clientId: z.string().min(1, "Seleziona un cliente"),
  projectId: z.string().optional(),
  issueDate: z.string().min(1, "Data obbligatoria"),
  expiryDate: z.string().optional(),
  status: z.enum(["draft", "sent", "accepted", "rejected", "expired"]),
  notes: z.string().optional(),
  items: z.array(quoteItemSchema).min(1, "Aggiungi almeno una riga"),
});

export type QuoteItemInput = z.infer<typeof quoteItemSchema>;
export type QuoteInput = z.infer<typeof quoteSchema>;

export function calculateLineTotal(item: { quantity: string; unitPrice: string; discountPercent?: string }) {
  const qty = Number(item.quantity) || 0;
  const price = Number(item.unitPrice) || 0;
  const discount = Number(item.discountPercent) || 0;
  return qty * price * (1 - discount / 100);
}

export function calculateDocumentTotals(items: QuoteItemInput[]) {
  let subtotal = 0;
  let vatAmount = 0;
  for (const item of items) {
    const lineTotal = calculateLineTotal(item);
    const vatRate = Number(item.vatRate) || 0;
    subtotal += lineTotal;
    vatAmount += lineTotal * (vatRate / 100);
  }
  return { subtotal, vatAmount, total: subtotal + vatAmount };
}
