import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PROJECT_STATUS, QUOTE_STATUS, INVOICE_STATUS } from "@/lib/constants";

const STATUS_TONE: Record<string, "success" | "warning" | "destructive" | "secondary"> = {
  paid: "success",
  accepted: "success",
  completed: "success",
  partially_paid: "warning",
  sent: "warning",
  in_progress: "warning",
  overdue: "destructive",
  rejected: "destructive",
  cancelled: "secondary",
  draft: "secondary",
  planned: "secondary",
};

function EmptyRow({ label }: { label: string }) {
  return <p className="text-sm text-muted-foreground">{label}</p>;
}

export function ProjectsList({ projects }: { projects: { id: string; name: string; status: string; project_value: number }[] }) {
  if (projects.length === 0) return <EmptyRow label="Nessun progetto collegato." />;
  return (
    <ul className="space-y-2">
      {projects.map((p) => (
        <li key={p.id} className="flex items-center justify-between gap-3 rounded-md border p-3 text-sm">
          <span className="font-medium">{p.name}</span>
          <div className="flex items-center gap-2">
            <span className="tabular text-muted-foreground">{formatCurrency(p.project_value)}</span>
            <Badge variant={STATUS_TONE[p.status] ?? "secondary"}>
              {PROJECT_STATUS[p.status as keyof typeof PROJECT_STATUS] ?? p.status}
            </Badge>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function QuotesList({ quotes }: { quotes: { id: string; quote_number: string; status: string; total: number; issue_date: string }[] }) {
  if (quotes.length === 0) return <EmptyRow label="Nessun preventivo collegato." />;
  return (
    <ul className="space-y-2">
      {quotes.map((q) => (
        <li key={q.id} className="flex items-center justify-between gap-3 rounded-md border p-3 text-sm">
          <div>
            <span className="font-medium">{q.quote_number}</span>
            <span className="ml-2 text-xs text-muted-foreground">{formatDate(q.issue_date)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="tabular text-muted-foreground">{formatCurrency(q.total)}</span>
            <Badge variant={STATUS_TONE[q.status] ?? "secondary"}>
              {QUOTE_STATUS[q.status as keyof typeof QUOTE_STATUS] ?? q.status}
            </Badge>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function InvoicesList({
  invoices,
}: {
  invoices: { id: string; invoice_number: string; status: string; total: number; paid_amount: number; issue_date: string }[];
}) {
  if (invoices.length === 0) return <EmptyRow label="Nessuna fattura collegata." />;
  return (
    <ul className="space-y-2">
      {invoices.map((i) => (
        <li key={i.id} className="flex items-center justify-between gap-3 rounded-md border p-3 text-sm">
          <div>
            <span className="font-medium">{i.invoice_number}</span>
            <span className="ml-2 text-xs text-muted-foreground">{formatDate(i.issue_date)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="tabular text-muted-foreground">
              {formatCurrency(i.paid_amount)} / {formatCurrency(i.total)}
            </span>
            <Badge variant={STATUS_TONE[i.status] ?? "secondary"}>
              {INVOICE_STATUS[i.status as keyof typeof INVOICE_STATUS] ?? i.status}
            </Badge>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function PaymentsList({
  payments,
}: {
  payments: { id: string; amount: number; payment_date: string; payment_method: string; invoices: { invoice_number: string } | null }[];
}) {
  if (payments.length === 0) return <EmptyRow label="Nessun pagamento registrato." />;
  return (
    <ul className="space-y-2">
      {payments.map((p) => (
        <li key={p.id} className="flex items-center justify-between gap-3 rounded-md border p-3 text-sm">
          <span>Fattura {p.invoices?.invoice_number ?? "—"} · {formatDate(p.payment_date)}</span>
          <span className="tabular font-medium text-success">{formatCurrency(p.amount)}</span>
        </li>
      ))}
    </ul>
  );
}
