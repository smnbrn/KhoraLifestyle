// Etichette in italiano per gli stati/priorità definiti nello schema DB
// (sezione 6 del documento di architettura). Unica fonte di verità:
// import da qui invece di ripetere le stringhe nei componenti.

export const PROJECT_STATUS = {
  planned: "Pianificato",
  in_progress: "In corso",
  paused: "In pausa",
  completed: "Completato",
  cancelled: "Annullato",
} as const;

export const TASK_STATUS = {
  todo: "Da fare",
  in_progress: "In corso",
  in_review: "In revisione",
  completed: "Completato",
} as const;

export const PRIORITY = {
  low: "Bassa",
  medium: "Media",
  high: "Alta",
  urgent: "Urgente",
} as const;

export const QUOTE_STATUS = {
  draft: "Bozza",
  sent: "Inviato",
  accepted: "Accettato",
  rejected: "Rifiutato",
  expired: "Scaduto",
} as const;

export const INVOICE_STATUS = {
  draft: "Bozza",
  issued: "Emessa",
  partially_paid: "Parzialmente pagata",
  paid: "Pagata",
  overdue: "Scaduta",
  cancelled: "Annullata",
} as const;

export const PAYMENT_METHOD = {
  bank_transfer: "Bonifico",
  card: "Carta",
  cash: "Contanti",
  paypal: "PayPal",
  other: "Altro",
} as const;

export const COMMISSION_STATUS = {
  to_pay: "Da pagare",
  paid: "Pagata",
} as const;

export type ProjectStatus = keyof typeof PROJECT_STATUS;
export type TaskStatus = keyof typeof TASK_STATUS;
export type Priority = keyof typeof PRIORITY;
export type QuoteStatus = keyof typeof QUOTE_STATUS;
export type InvoiceStatus = keyof typeof INVOICE_STATUS;
export type PaymentMethod = keyof typeof PAYMENT_METHOD;
export type CommissionStatus = keyof typeof COMMISSION_STATUS;
