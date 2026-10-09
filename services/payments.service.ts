import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

type PaymentInsert = Database["public"]["Tables"]["payments"]["Insert"];

export async function listPaymentsByInvoice(userId: string, invoiceId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("payments")
    .select("*")
    .eq("user_id", userId)
    .eq("invoice_id", invoiceId)
    .order("payment_date", { ascending: false });
  return data ?? [];
}

export async function addPayment(values: PaymentInsert) {
  const supabase = await createClient();
  // Il trigger fn_sync_invoice_payment_status (Fase 2, testato) aggiorna da
  // solo paid_amount/status della fattura, e fn_create_transaction_from_payment
  // genera la transazione entrata collegata.
  return supabase.from("payments").insert(values).select().single();
}

export async function deletePayment(userId: string, paymentId: string) {
  const supabase = await createClient();
  return supabase.from("payments").delete().eq("user_id", userId).eq("id", paymentId);
}
