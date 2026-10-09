"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PAYMENT_METHOD } from "@/lib/constants";
import { removePayment } from "../actions";

type Payment = { id: string; amount: number; payment_date: string; payment_method: string; notes: string | null };

export function PaymentsList({ invoiceId, payments }: { invoiceId: string; payments: Payment[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete(paymentId: string) {
    startTransition(async () => {
      const result = await removePayment(invoiceId, paymentId);
      if (result.success) {
        toast.success("Pagamento eliminato");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  if (payments.length === 0) {
    return <p className="text-sm text-muted-foreground">Nessun pagamento registrato.</p>;
  }

  return (
    <ul className="space-y-2">
      {payments.map((payment) => (
        <li key={payment.id} className="flex items-center justify-between gap-3 rounded-md border p-3 text-sm">
          <div>
            <p className="font-medium">{formatCurrency(payment.amount)}</p>
            <p className="text-xs text-muted-foreground">
              {formatDate(payment.payment_date)} · {PAYMENT_METHOD[payment.payment_method as keyof typeof PAYMENT_METHOD] ?? payment.payment_method}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground hover:text-destructive"
            disabled={isPending}
            onClick={() => handleDelete(payment.id)}
          >
            <Trash2 className="size-4" />
          </Button>
        </li>
      ))}
    </ul>
  );
}
