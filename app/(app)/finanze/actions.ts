"use server";

import { revalidatePath } from "next/cache";

import { transactionSchema, categorySchema } from "@/schemas/transaction.schema";
import { commissionSchema } from "@/schemas/commission.schema";
import { getCurrentUser } from "@/services/auth.service";
import { createTransaction, updateTransaction, deleteTransaction, createCategory } from "@/services/finance.service";
import {
  createCommission,
  updateCommission,
  markCommissionPaid,
  markCommissionUnpaid,
  deleteCommission,
} from "@/services/commissions.service";
import type { ActionResult } from "@/lib/action-result";

function toNumber(value: string | undefined) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export async function saveTransaction(formData: FormData): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Sessione scaduta. Accedi di nuovo." };

  const parsed = transactionSchema.safeParse({
    type: formData.get("type"),
    categoryId: formData.get("categoryId") || undefined,
    description: formData.get("description") || undefined,
    amount: formData.get("amount"),
    transactionDate: formData.get("transactionDate"),
    clientId: formData.get("clientId") || undefined,
    projectId: formData.get("projectId") || undefined,
    paymentMethod: formData.get("paymentMethod") || undefined,
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const amount = toNumber(parsed.data.amount);
  if (amount <= 0) return { success: false, error: "L'importo deve essere maggiore di zero." };

  const id = formData.get("id") as string | null;
  const values = {
    type: parsed.data.type,
    category_id: parsed.data.categoryId || null,
    description: parsed.data.description || null,
    amount,
    transaction_date: parsed.data.transactionDate,
    client_id: parsed.data.clientId || null,
    project_id: parsed.data.projectId || null,
    payment_method: parsed.data.paymentMethod || null,
    notes: parsed.data.notes || null,
  };

  const { error } = id
    ? await updateTransaction(user.id, id, values)
    : await createTransaction({ ...values, user_id: user.id });

  if (error) return { success: false, error: "Salvataggio non riuscito." };

  revalidatePath("/finanze");
  revalidatePath("/dashboard");
  return { success: true, data: undefined };
}

export async function removeTransaction(id: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Sessione scaduta. Accedi di nuovo." };

  const { error } = await deleteTransaction(user.id, id);
  if (error) {
    return {
      success: false,
      error: "Impossibile eliminare: questa transazione è collegata a un pagamento. Eliminala dalla fattura corrispondente.",
    };
  }

  revalidatePath("/finanze");
  revalidatePath("/dashboard");
  return { success: true, data: undefined };
}

export async function addCategory(formData: FormData): Promise<ActionResult<{ id: string; name: string }>> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Sessione scaduta. Accedi di nuovo." };

  const parsed = categorySchema.safeParse({ name: formData.get("name"), type: formData.get("type") });
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const { data, error } = await createCategory(user.id, parsed.data.name, parsed.data.type);
  if (error || !data) return { success: false, error: "Creazione categoria non riuscita." };

  revalidatePath("/finanze");
  return { success: true, data: { id: data.id, name: data.name } };
}

export async function saveCommission(formData: FormData): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Sessione scaduta. Accedi di nuovo." };

  const parsed = commissionSchema.safeParse({
    description: formData.get("description"),
    amount: formData.get("amount"),
    percentage: formData.get("percentage") || undefined,
    commissionDate: formData.get("commissionDate"),
    clientId: formData.get("clientId") || undefined,
    projectId: formData.get("projectId") || undefined,
    status: formData.get("status"),
  });
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const id = formData.get("id") as string | null;
  const values = {
    description: parsed.data.description,
    amount: toNumber(parsed.data.amount),
    percentage: parsed.data.percentage ? toNumber(parsed.data.percentage) : null,
    commission_date: parsed.data.commissionDate,
    client_id: parsed.data.clientId || null,
    project_id: parsed.data.projectId || null,
    status: parsed.data.status,
  };

  const { error } = id
    ? await updateCommission(user.id, id, values)
    : await createCommission({ ...values, user_id: user.id });

  if (error) return { success: false, error: "Salvataggio non riuscito." };

  revalidatePath("/finanze");
  return { success: true, data: undefined };
}

export async function toggleCommissionStatus(id: string, markPaid: boolean): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Sessione scaduta. Accedi di nuovo." };

  const { error } = markPaid ? await markCommissionPaid(user.id, id) : await markCommissionUnpaid(user.id, id);
  if (error) return { success: false, error: "Operazione non riuscita." };

  revalidatePath("/finanze");
  revalidatePath("/dashboard");
  return { success: true, data: undefined };
}

export async function removeCommission(id: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Sessione scaduta. Accedi di nuovo." };

  const { error } = await deleteCommission(user.id, id);
  if (error) return { success: false, error: "Eliminazione non riuscita." };

  revalidatePath("/finanze");
  return { success: true, data: undefined };
}
