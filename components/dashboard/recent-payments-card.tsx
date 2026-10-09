import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";

type Payment = {
  id: string;
  amount: number;
  payment_date: string;
  invoices: { invoice_number: string } | null;
};

export function RecentPaymentsCard({ payments }: { payments: Payment[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Pagamenti recenti</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {payments.length === 0 && <p className="text-sm text-muted-foreground">Nessun pagamento ancora.</p>}
        {payments.map((payment) => (
          <div key={payment.id} className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                Fattura {payment.invoices?.invoice_number ?? "—"}
              </p>
              <p className="text-xs text-muted-foreground">{formatDate(payment.payment_date)}</p>
            </div>
            <span className="tabular shrink-0 text-sm font-medium text-success">
              +{formatCurrency(payment.amount)}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
