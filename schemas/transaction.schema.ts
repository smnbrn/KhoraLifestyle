import { z } from "zod";

export const transactionSchema = z.object({
  type: z.enum(["income", "expense"]),
  categoryId: z.string().optional(),
  description: z.string().optional(),
  amount: z.string().min(1, "Importo obbligatorio"),
  transactionDate: z.string().min(1, "Data obbligatoria"),
  clientId: z.string().optional(),
  projectId: z.string().optional(),
  paymentMethod: z.string().optional(),
  notes: z.string().optional(),
});

export type TransactionInput = z.infer<typeof transactionSchema>;

export const categorySchema = z.object({
  name: z.string().min(1, "Il nome è obbligatorio"),
  type: z.enum(["income", "expense"]),
});

export type CategoryInput = z.infer<typeof categorySchema>;
