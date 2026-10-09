import { notFound } from "next/navigation";
import Link from "next/link";
import { Pencil, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";
import { INVOICE_STATUS } from "@/lib/constants";
import { getCurrentUser } from "@/services/auth.service";
import { getInvoiceWithItems, effectiveStatus } from "@/services/invoices.service";
import { listPaymentsByInvoice } from "@/services/payments.service";
import { InvoiceStatusSelect } from "./status-select";
import { DeleteOrCancelButton } from "./delete-or-cancel-button";
import { PaymentFormDialog } from "./payment-form-dialog";
import { PaymentsList } from "./payments-list";

const STATUS_TONE: Record<string, "success" | "warning" | "destructive" | "secondary"> = {
  paid: "success",
  partially_paid: "warning",
  overdue: "destructive",
  issued: "secondary",
  draft: "secondary",
  cancelled: "secondary",
};

export default async function FatturaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  const result = await getInvoiceWithItems(user!.id, id);

  if (!result) notFound();
  const { invoice, items } = result;
  const client = invoice.clients as { id: string; name: string } | null;
  const displayStatus = effectiveStatus(invoice.status, invoice.due_date);
  const remainingAmount = invoice.remaining_amount ?? 0;

  return (
    <div className="space-y-6 px-4 py-6 md:px-6 md:py-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold text-foreground">Fattura {invoice.invoice_number}</h1>
            <Badge variant={STATUS_TONE[displayStatus] ?? "secondary"}>
              {INVOICE_STATUS[displayStatus as keyof typeof INVOICE_STATUS] ?? displayStatus}
            </Badge>
          </div>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {client && (
              <Link href={`/clienti/${client.id}`} className="hover:underline">
                {client.name}
              </Link>
            )}
            <span>Emessa il {formatDate(invoice.issue_date)}</span>
            {invoice.due_date && <span>Scadenza {formatDate(invoice.due_date)}</span>}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <InvoiceStatusSelect invoiceId={invoice.id} status={invoice.status} />
          <Button variant="outline" asChild>
            <Link href={`/fatture/${invoice.id}/modifica`}>
              <Pencil />
              Modifica
            </Link>
          </Button>
          <DeleteOrCancelButton invoiceId={invoice.id} status={invoice.status} />
        </div>
      </div>

      <Card className="py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descrizione</TableHead>
              <TableHead className="text-right">Qtà</TableHead>
              <TableHead className="text-right">Prezzo unit.</TableHead>
              <TableHead className="text-right">Sconto</TableHead>
              <TableHead className="text-right">IVA</TableHead>
              <TableHead className="text-right">Totale</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.description}</TableCell>
                <TableCell className="tabular text-right">{item.quantity}</TableCell>
                <TableCell className="tabular text-right">{formatCurrency(item.unit_price)}</TableCell>
                <TableCell className="tabular text-right">{item.discount_percent}%</TableCell>
                <TableCell className="tabular text-right">{item.vat_rate}%</TableCell>
                <TableCell className="tabular text-right font-medium">{formatCurrency(item.line_total)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Imponibile</span>
              <span className="tabular">{formatCurrency(invoice.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">IVA</span>
              <span className="tabular">{formatCurrency(invoice.vat_amount)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-base font-semibold">
              <span>Totale</span>
              <span className="tabular">{formatCurrency(invoice.total)}</span>
            </div>
            <div className="flex justify-between text-sm text-success">
              <span>Pagato</span>
              <span className="tabular">{formatCurrency(invoice.paid_amount)}</span>
            </div>
            <div className="flex justify-between text-sm font-medium text-warning">
              <span>Residuo</span>
              <span className="tabular">{formatCurrency(remainingAmount)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Pagamenti</CardTitle>
            {remainingAmount > 0 && invoice.status !== "cancelled" && (
              <PaymentFormDialog
                invoiceId={invoice.id}
                remainingAmount={remainingAmount}
                trigger={
                  <Button size="sm">
                    <Plus />
                    Registra pagamento
                  </Button>
                }
              />
            )}
          </CardHeader>
          <CardContent>
            <PaymentsListLoader userId={user!.id} invoiceId={invoice.id} />
          </CardContent>
        </Card>
      </div>

      {invoice.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Note</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{invoice.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

async function PaymentsListLoader({ userId, invoiceId }: { userId: string; invoiceId: string }) {
  const payments = await listPaymentsByInvoice(userId, invoiceId);
  return <PaymentsList invoiceId={invoiceId} payments={payments} />;
}
