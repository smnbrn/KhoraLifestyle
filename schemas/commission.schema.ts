import { z } from "zod";

export const commissionSchema = z.object({
  description: z.string().min(1, "La descrizione è obbligatoria"),
  amount: z.string().min(1, "Importo obbligatorio"),
  percentage: z.string().optional(),
  commissionDate: z.string().min(1, "Data obbligatoria"),
  clientId: z.string().optional(),
  projectId: z.string().optional(),
  status: z.enum(["to_pay", "paid"]),
});

export type CommissionInput = z.infer<typeof commissionSchema>;
