"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TASK_STATUS } from "@/lib/constants";
import { changeTaskStatus } from "./actions";

export function QuickStatusSelect({ taskId, status }: { taskId: string; status: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleChange(value: string) {
    startTransition(async () => {
      const result = await changeTaskStatus(taskId, value);
      if (result.success) {
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Select value={status} onValueChange={handleChange} disabled={isPending}>
      <SelectTrigger className="h-8 w-[150px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(TASK_STATUS).map(([value, label]) => (
          <SelectItem key={value} value={value}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
