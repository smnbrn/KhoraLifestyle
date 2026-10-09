import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { INVOICE_STATUS } from "@/lib/constants";

const STATUS_TONE: Record<string, "success" | "warning" | "destructive" | "secondary"> = {
  paid: "success",
  partially_paid: "warning",
  overdue: "destructive",
  issued: "secondary",
  draft: "secondary",
  cancelled: "secondary",
};

type Invoice = {
  id: string;
  invoice_number: string;
  total: number;
  status: string;
  issue_date: string;
  clients: { name: string } | null;
};

export function RecentInvoicesCard({ invoices }: { invoices: Invoice[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Ultime fatture</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {invoices.length === 0 && <p className="text-sm text-muted-foreground">Nessuna fattura ancora.</p>}
        {invoices.map((invoice) => (
          <Link
            key={invoice.id}
            href={`/fatture/${invoice.id}`}
            className="flex items-center justify-between gap-3 rounded-md -mx-2 px-2 py-1.5 hover:bg-accent"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{invoice.clients?.name ?? "Cliente"}</p>
              <p className="text-xs text-muted-foreground">
                {invoice.invoice_number} · {formatDate(invoice.issue_date)}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="tabular text-sm font-medium">{formatCurrency(invoice.total)}</span>
              <Badge variant={STATUS_TONE[invoice.status] ?? "secondary"}>
                {INVOICE_STATUS[invoice.status as keyof typeof INVOICE_STATUS] ?? invoice.status}
              </Badge>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
