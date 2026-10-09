import type { ProjectInput } from "@/schemas/project.schema";
import type { TaskInput } from "@/schemas/task.schema";
import type { QuoteInput } from "@/schemas/quote.schema";
import type { InvoiceInput } from "@/schemas/invoice.schema";

// Perché serve questo file: i tipi generati da Supabase per colonne
// "text ... check (col in (...))" non garantiscono sempre l'inferenza
// dell'union letterale (dipende da come il generatore legge il vincolo) —
// in pratica spesso arrivano come "string". Passare quella stringa a un
// componente che si aspetta l'union esatto (es. il Select di un form) va
// quindi validato qui, con una ricaduta esplicita, invece di un cast alla
// cieca che nasconderebbe un valore realmente fuori dominio.

const PROJECT_STATUSES = ["planned", "in_progress", "paused", "completed", "cancelled"] as const;
const PRIORITIES = ["low", "medium", "high", "urgent"] as const;
const TASK_STATUSES = ["todo", "in_progress", "in_review", "completed"] as const;
const QUOTE_STATUSES = ["draft", "sent", "accepted", "rejected", "expired"] as const;
const INVOICE_STATUSES = ["draft", "issued", "partially_paid", "paid", "overdue", "cancelled"] as const;

function narrow<T extends string>(value: string, allowed: readonly T[], fallback: T): T {
  return (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

export function toProjectStatus(value: string): ProjectInput["status"] {
  return narrow(value, PROJECT_STATUSES, "planned");
}

export function toPriority(value: string): ProjectInput["priority"] {
  return narrow(value, PRIORITIES, "medium");
}

export function toTaskStatus(value: string): TaskInput["status"] {
  return narrow(value, TASK_STATUSES, "todo");
}

export function toQuoteStatus(value: string): QuoteInput["status"] {
  return narrow(value, QUOTE_STATUSES, "draft");
}

export function toInvoiceStatus(value: string): InvoiceInput["status"] {
  return narrow(value, INVOICE_STATUSES, "draft");
}
