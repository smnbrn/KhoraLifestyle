"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";
import { removeTransaction } from "./actions";
import type { TransactionListItem } from "@/services/finance.service";

export function TransactionsTable({ transactions }: { transactions: TransactionListItem[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await removeTransaction(id);
      if (result.success) {
        toast.success("Movimento eliminato");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  if (transactions.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
        Nessun movimento trovato.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Descrizione</TableHead>
          <TableHead className="hidden sm:table-cell">Categoria</TableHead>
          <TableHead className="hidden md:table-cell">Cliente / Progetto</TableHead>
          <TableHead className="hidden lg:table-cell">Data</TableHead>
          <TableHead className="text-right">Importo</TableHead>
          <TableHead className="w-10" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((t) => (
          <TableRow key={t.id}>
            <TableCell className="font-medium">{t.description || "—"}</TableCell>
            <TableCell className="hidden sm:table-cell">
              {t.transaction_categories?.name ? (
                <Badge variant="outline">{t.transaction_categories.name}</Badge>
              ) : (
                "—"
              )}
            </TableCell>
            <TableCell className="hidden text-muted-foreground md:table-cell">
              {t.clients?.name ?? t.projects?.name ?? "—"}
            </TableCell>
            <TableCell className="hidden text-muted-foreground lg:table-cell">{formatDate(t.transaction_date)}</TableCell>
            <TableCell className={`tabular text-right font-medium ${t.type === "income" ? "text-success" : "text-destructive"}`}>
              {t.type === "income" ? "+" : "-"}
              {formatCurrency(t.amount)}
            </TableCell>
            <TableCell>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-muted-foreground hover:text-destructive"
                disabled={isPending}
                onClick={() => handleDelete(t.id)}
              >
                <Trash2 className="size-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
