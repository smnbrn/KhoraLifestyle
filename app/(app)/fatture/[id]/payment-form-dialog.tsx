"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PAYMENT_METHOD } from "@/lib/constants";
import { paymentSchema, type PaymentInput } from "@/schemas/invoice.schema";
import { registerPayment } from "../actions";

export function PaymentFormDialog({
  invoiceId,
  remainingAmount,
  trigger,
}: {
  invoiceId: string;
  remainingAmount: number;
  trigger: ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<PaymentInput>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      paymentMethod: "bank_transfer",
      paymentDate: new Date().toISOString().slice(0, 10),
      amount: remainingAmount > 0 ? String(remainingAmount) : "",
    },
  });

  function onSubmit(values: PaymentInput) {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("amount", values.amount);
      formData.set("paymentDate", values.paymentDate);
      formData.set("paymentMethod", values.paymentMethod);
      formData.set("notes", values.notes ?? "");

      const result = await registerPayment(invoiceId, formData);
      if (result.success) {
        toast.success("Pagamento registrato");
        setOpen(false);
        reset();
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <DialogHeader>
            <DialogTitle>Registra pagamento</DialogTitle>
            <DialogDescription>Anche parziale — lo stato della fattura si aggiorna da solo.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Importo (€) *</Label>
              <Input id="amount" type="number" step="0.01" min="0.01" {...register("amount")} />
              {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="paymentDate">Data *</Label>
                <Input id="paymentDate" type="date" {...register("paymentDate")} />
              </div>
              <div className="space-y-2">
                <Label>Metodo</Label>
                <Controller
                  name="paymentMethod"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(PAYMENT_METHOD).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Note</Label>
              <Textarea id="notes" rows={2} {...register("notes")} />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Registrazione…" : "Registra pagamento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
