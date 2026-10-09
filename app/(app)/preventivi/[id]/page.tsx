import { notFound } from "next/navigation";
import Link from "next/link";
import { Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getCurrentUser } from "@/services/auth.service";
import { getQuoteWithItems } from "@/services/quotes.service";
import { QuoteStatusSelect } from "./status-select";
import { DeleteQuoteButton } from "./delete-quote-button";

export default async function PreventivoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  const result = await getQuoteWithItems(user!.id, id);

  if (!result) notFound();
  const { quote, items } = result;
  const client = quote.clients as { id: string; name: string } | null;

  return (
    <div className="space-y-6 px-4 py-6 md:px-6 md:py-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Preventivo {quote.quote_number}</h1>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {client && (
              <Link href={`/clienti/${client.id}`} className="hover:underline">
                {client.name}
              </Link>
            )}
            <span>Emesso il {formatDate(quote.issue_date)}</span>
            {quote.expiry_date && <span>Scade il {formatDate(quote.expiry_date)}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <QuoteStatusSelect quoteId={quote.id} status={quote.status} />
          <Button variant="outline" asChild>
            <Link href={`/preventivi/${quote.id}/modifica`}>
              <Pencil />
              Modifica
            </Link>
          </Button>
          <DeleteQuoteButton quoteId={quote.id} />
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

      <Card>
        <CardContent className="ml-auto max-w-xs space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Imponibile</span>
            <span className="tabular">{formatCurrency(quote.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">IVA</span>
            <span className="tabular">{formatCurrency(quote.vat_amount)}</span>
          </div>
          <Separator />
          <div className="flex justify-between text-base font-semibold">
            <span>Totale</span>
            <span className="tabular">{formatCurrency(quote.total)}</span>
          </div>
        </CardContent>
      </Card>

      {quote.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Note</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{quote.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
