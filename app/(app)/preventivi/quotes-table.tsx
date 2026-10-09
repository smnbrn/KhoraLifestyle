import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";
import { QUOTE_STATUS } from "@/lib/constants";
import type { QuoteListItem } from "@/services/quotes.service";

const STATUS_TONE: Record<string, "success" | "warning" | "destructive" | "secondary"> = {
  accepted: "success",
  sent: "warning",
  rejected: "destructive",
  expired: "destructive",
  draft: "secondary",
};

export function QuotesTable({ quotes }: { quotes: QuoteListItem[] }) {
  if (quotes.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
        Nessun preventivo trovato.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Numero</TableHead>
          <TableHead className="hidden sm:table-cell">Cliente</TableHead>
          <TableHead className="hidden md:table-cell">Data</TableHead>
          <TableHead className="hidden lg:table-cell">Scadenza</TableHead>
          <TableHead className="text-right">Totale</TableHead>
          <TableHead>Stato</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {quotes.map((quote) => (
          <TableRow key={quote.id}>
            <TableCell className="font-medium">
              <Link href={`/preventivi/${quote.id}`} className="hover:underline">
                {quote.quote_number}
              </Link>
            </TableCell>
            <TableCell className="hidden text-muted-foreground sm:table-cell">{quote.clients?.name ?? "—"}</TableCell>
            <TableCell className="hidden text-muted-foreground md:table-cell">{formatDate(quote.issue_date)}</TableCell>
            <TableCell className="hidden text-muted-foreground lg:table-cell">
              {quote.expiry_date ? formatDate(quote.expiry_date) : "—"}
            </TableCell>
            <TableCell className="tabular text-right">{formatCurrency(quote.total)}</TableCell>
            <TableCell>
              <Badge variant={STATUS_TONE[quote.status] ?? "secondary"}>
                {QUOTE_STATUS[quote.status as keyof typeof QUOTE_STATUS] ?? quote.status}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
