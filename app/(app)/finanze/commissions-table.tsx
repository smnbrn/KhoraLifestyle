"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toggleCommissionStatus, removeCommission } from "./actions";
import type { CommissionListItem } from "@/services/commissions.service";

export function CommissionsTable({ commissions }: { commissions: CommissionListItem[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleToggle(id: string, currentlyPaid: boolean) {
    startTransition(async () => {
      const result = await toggleCommissionStatus(id, !currentlyPaid);
      if (result.success) {
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await removeCommission(id);
      if (result.success) {
        toast.success("Commissione eliminata");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  if (commissions.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
        Nessuna commissione trovata.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10">Pagata</TableHead>
          <TableHead>Descrizione</TableHead>
          <TableHead className="hidden sm:table-cell">Cliente / Progetto</TableHead>
          <TableHead className="hidden md:table-cell">Data</TableHead>
          <TableHead className="text-right">Importo</TableHead>
          <TableHead className="w-10" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {commissions.map((c) => {
          const isPaid = c.status === "paid";
          return (
            <TableRow key={c.id}>
              <TableCell>
                <Checkbox checked={isPaid} disabled={isPending} onCheckedChange={() => handleToggle(c.id, isPaid)} />
              </TableCell>
              <TableCell className="font-medium">
                {c.description}
                {c.percentage != null && <span className="ml-2 text-xs text-muted-foreground">({c.percentage}%)</span>}
              </TableCell>
              <TableCell className="hidden text-muted-foreground sm:table-cell">
                {c.clients?.name ?? c.projects?.name ?? "—"}
              </TableCell>
              <TableCell className="hidden text-muted-foreground md:table-cell">{formatDate(c.commission_date)}</TableCell>
              <TableCell className="tabular text-right font-medium">{formatCurrency(c.amount)}</TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-muted-foreground hover:text-destructive"
                  disabled={isPending}
                  onClick={() => handleDelete(c.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
