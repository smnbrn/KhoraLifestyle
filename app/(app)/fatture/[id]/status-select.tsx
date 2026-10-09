"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { INVOICE_STATUS } from "@/lib/constants";
import { changeStatus } from "../actions";

export function InvoiceStatusSelect({ invoiceId, status }: { invoiceId: string; status: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleChange(value: string) {
    startTransition(async () => {
      const result = await changeStatus(invoiceId, value);
      if (result.success) {
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Select value={status} onValueChange={handleChange} disabled={isPending}>
      <SelectTrigger className="w-[170px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(INVOICE_STATUS)
          .filter(([value]) => value !== "overdue")
          .map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
      </SelectContent>
    </Select>
  );
}
