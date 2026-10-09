"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { quoteSchema } from "@/schemas/quote.schema";
import { getCurrentUser } from "@/services/auth.service";
import {
  createQuoteWithItems,
  updateQuoteWithItems,
  changeQuoteStatus,
  deleteQuoteRecord,
} from "@/services/quotes.service";
import type { ActionResult } from "@/lib/action-result";

function parseQuoteFormData(formData: FormData) {
  const itemsRaw = formData.get("itemsJson");
  const items = itemsRaw ? JSON.parse(String(itemsRaw)) : [];

  return quoteSchema.safeParse({
    clientId: formData.get("clientId"),
    projectId: formData.get("projectId") || undefined,
    issueDate: formData.get("issueDate"),
    expiryDate: formData.get("expiryDate") || undefined,
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

export async function createQuote(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Sessione scaduta. Accedi di nuovo." };

  const parsed = parseQuoteFormData(formData);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const { data, error } = await createQuoteWithItems(
    user.id,
    {
      client_id: parsed.data.clientId,
      project_id: parsed.data.projectId || null,
      issue_date: parsed.data.issueDate,
      expiry_date: parsed.data.expiryDate || null,
      status: parsed.data.status,
      notes: parsed.data.notes || null,
    },
    itemsToDbRows(parsed.data.items)
  );

  if (error || !data) return { success: false, error: "Creazione non riuscita. Riprova." };

  revalidatePath("/preventivi");
  return { success: true, data: { id: data.id } };
}

export async function createQuoteAndRedirect(formData: FormData) {
  const result = await createQuote(formData);
  if (result.success) redirect(`/preventivi/${result.data.id}`);
  return result;
}

export async function updateQuote(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Sessione scaduta. Accedi di nuovo." };

  const quoteId = formData.get("id") as string;
  const parsed = parseQuoteFormData(formData);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const { error } = await updateQuoteWithItems(
    user.id,
    quoteId,
    {
      client_id: parsed.data.clientId,
      project_id: parsed.data.projectId || null,
      issue_date: parsed.data.issueDate,
      expiry_date: parsed.data.expiryDate || null,
      status: parsed.data.status,
      notes: parsed.data.notes || null,
    },
    itemsToDbRows(parsed.data.items)
  );

  if (error) return { success: false, error: "Aggiornamento non riuscito. Riprova." };

  revalidatePath("/preventivi");
  revalidatePath(`/preventivi/${quoteId}`);
  return { success: true, data: { id: quoteId } };
}

export async function updateQuoteAndRedirect(formData: FormData) {
  const result = await updateQuote(formData);
  if (result.success) redirect(`/preventivi/${result.data.id}`);
  return result;
}

export async function changeStatus(quoteId: string, status: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Sessione scaduta. Accedi di nuovo." };

  const { error } = await changeQuoteStatus(user.id, quoteId, status);
  if (error) return { success: false, error: "Aggiornamento non riuscito." };

  revalidatePath("/preventivi");
  revalidatePath(`/preventivi/${quoteId}`);
  return { success: true, data: undefined };
}

export async function deleteQuote(quoteId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Sessione scaduta. Accedi di nuovo." };

  const { error } = await deleteQuoteRecord(user.id, quoteId);
  if (error) return { success: false, error: "Eliminazione non riuscita." };

  revalidatePath("/preventivi");
  return { success: true, data: undefined };
}
