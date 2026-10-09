"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { invoiceSchema, paymentSchema } from "@/schemas/invoice.schema";
import { getCurrentUser } from "@/services/auth.service";
import {
  createInvoiceWithItems,
  updateInvoiceWithItems,
  changeInvoiceStatus,
  deleteOrCancelInvoice,
} from "@/services/invoices.service";
import { addPayment, deletePayment } from "@/services/payments.service";
import type { ActionResult } from "@/lib/action-result";

function parseInvoiceFormData(formData: FormData) {
  const itemsRaw = formData.get("itemsJson");
  const items = itemsRaw ? JSON.parse(String(itemsRaw)) : [];

  return invoiceSchema.safeParse({
    clientId: formData.get("clientId"),
    projectId: formData.get("projectId") || undefined,
    quoteId: formData.get("quoteId") || undefined,
    issueDate: formData.get("issueDate"),
    dueDate: formData.get("dueDate") || undefined,
    status: formData.get("status"),
    notes: formData.get("notes") || undefined,
    items,
  });
}

function itemsToDbRows(items: { description: string; quantity: string; unitPrice: string; discountPercent?: string; vatRate?: string }[]) {
  return items.map((item) => {
    const quantity = Number(item.quantity) || 0;
    const unitPrice = Number(item.unitPrice) || 0;
    const discountPercent = Number(item.discountPercent) || 0;
    const vatRate = item.vatRate ? Number(item.vatRate) : 22;
    const lineTotal = quantity * unitPrice * (1 - discountPercent / 100);
    return {
      description: item.description,
      quantity,
      unit_price: unitPrice,
      discount_percent: discountPercent,
      vat_rate: vatRate,
      line_total: Math.round(lineTotal * 100) / 100,
    };
  });
}

export async function createInvoice(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Sessione scaduta. Accedi di nuovo." };

  const parsed = parseInvoiceFormData(formData);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const { data, error } = await createInvoiceWithItems(
    user.id,
    {
      client_id: parsed.data.clientId,
      project_id: parsed.data.projectId || null,
      quote_id: parsed.data.quoteId || null,
      issue_date: parsed.data.issueDate,
      due_date: parsed.data.dueDate || null,
      status: parsed.data.status,
      notes: parsed.data.notes || null,
    },
    itemsToDbRows(parsed.data.items)
  );

  if (error || !data) return { success: false, error: "Creazione non riuscita. Riprova." };

  revalidatePath("/fatture");
  revalidatePath("/dashboard");
  return { success: true, data: { id: data.id } };
}

export async function createInvoiceAndRedirect(formData: FormData) {
  const result = await createInvoice(formData);
  if (result.success) redirect(`/fatture/${result.data.id}`);
  return result;
}

export async function updateInvoice(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Sessione scaduta. Accedi di nuovo." };

  const invoiceId = formData.get("id") as string;
  const parsed = parseInvoiceFormData(formData);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const { error } = await updateInvoiceWithItems(
    user.id,
    invoiceId,
    {
      client_id: parsed.data.clientId,
      project_id: parsed.data.projectId || null,
      quote_id: parsed.data.quoteId || null,
      issue_date: parsed.data.issueDate,
      due_date: parsed.data.dueDate || null,
      status: parsed.data.status,
      notes: parsed.data.notes || null,
    },
    itemsToDbRows(parsed.data.items)
  );

  if (error) return { success: false, error: "Aggiornamento non riuscito. Riprova." };

  revalidatePath("/fatture");
  revalidatePath(`/fatture/${invoiceId}`);
  revalidatePath("/dashboard");
  return { success: true, data: { id: invoiceId } };
}

export async function updateInvoiceAndRedirect(formData: FormData) {
  const result = await updateInvoice(formData);
  if (result.success) redirect(`/fatture/${result.data.id}`);
  return result;
}

export async function changeStatus(invoiceId: string, status: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Sessione scaduta. Accedi di nuovo." };

  const { error } = await changeInvoiceStatus(user.id, invoiceId, status);
  if (error) return { success: false, error: "Aggiornamento non riuscito." };

  revalidatePath("/fatture");
  revalidatePath(`/fatture/${invoiceId}`);
  revalidatePath("/dashboard");
  return { success: true, data: undefined };
}

export async function deleteOrCancel(invoiceId: string, currentStatus: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Sessione scaduta. Accedi di nuovo." };

  const { error } = await deleteOrCancelInvoice(user.id, invoiceId, currentStatus);
  if (error) return { success: false, error: "Operazione non riuscita." };

  revalidatePath("/fatture");
  revalidatePath("/dashboard");
  return { success: true, data: undefined };
}

export async function registerPayment(invoiceId: string, formData: FormData): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Sessione scaduta. Accedi di nuovo." };

  const parsed = paymentSchema.safeParse({
    amount: formData.get("amount"),
    paymentDate: formData.get("paymentDate"),
    paymentMethod: formData.get("paymentMethod"),
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const amount = Number(parsed.data.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return { success: false, error: "Inserisci un importo valido." };
  }

  const { error } = await addPayment({
    user_id: user.id,
    invoice_id: invoiceId,
    amount,
    payment_date: parsed.data.paymentDate,
    payment_method: parsed.data.paymentMethod,
    notes: parsed.data.notes || null,
  });

  if (error) return { success: false, error: "Registrazione pagamento non riuscita." };

  revalidatePath(`/fatture/${invoiceId}`);
  revalidatePath("/fatture");
  revalidatePath("/dashboard");
  revalidatePath("/finanze");
  return { success: true, data: undefined };
}

export async function removePayment(invoiceId: string, paymentId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Sessione scaduta. Accedi di nuovo." };

  const { error } = await deletePayment(user.id, paymentId);
  if (error) return { success: false, error: "Eliminazione non riuscita." };

  revalidatePath(`/fatture/${invoiceId}`);
  revalidatePath("/fatture");
  revalidatePath("/dashboard");
  revalidatePath("/finanze");
  return { success: true, data: undefined };
}
