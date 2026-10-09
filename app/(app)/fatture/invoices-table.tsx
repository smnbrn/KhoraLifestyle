import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";
import { INVOICE_STATUS } from "@/lib/constants";
import { effectiveStatus } from "@/services/invoices.service";
import type { InvoiceListItem } from "@/services/invoices.service";

const STATUS_TONE: Record<string, "success" | "warning" | "destructive" | "secondary"> = {
  paid: "success",
  partially_paid: "warning",
  overdue: "destructive",
  issued: "secondary",
  draft: "secondary",
  cancelled: "secondary",
};

export function InvoicesTable({ invoices }: { invoices: InvoiceListItem[] }) {
  if (invoices.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
        Nessuna fattura trovata.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Numero</TableHead>
          <TableHead className="hidden sm:table-cell">Cliente</TableHead>
          <TableHead className="hidden md:table-cell">Scadenza</TableHead>
          <TableHead className="text-right">Totale</TableHead>
          <TableHead className="hidden lg:table-cell text-right">Residuo</TableHead>
          <TableHead>Stato</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map((invoice) => {
          const status = effectiveStatus(invoice.status, invoice.due_date);
          return (
            <TableRow key={invoice.id}>
              <TableCell className="font-medium">
                <Link href={`/fatture/${invoice.id}`} className="hover:underline">
                  {invoice.invoice_number}
                </Link>
              </TableCell>
              <TableCell className="hidden text-muted-foreground sm:table-cell">
                {invoice.clients?.name ?? "—"}
              </TableCell>
              <TableCell className="hidden text-muted-foreground md:table-cell">
                {invoice.due_date ? formatDate(invoice.due_date) : "—"}
              </TableCell>
              <TableCell className="tabular text-right">{formatCurrency(invoice.total)}</TableCell>
              <TableCell className="tabular hidden text-right lg:table-cell">
                {formatCurrency(invoice.remaining_amount ?? 0)}
              </TableCell>
              <TableCell>
                <Badge variant={STATUS_TONE[status] ?? "secondary"}>
                  {INVOICE_STATUS[status as keyof typeof INVOICE_STATUS] ?? status}
                </Badge>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
