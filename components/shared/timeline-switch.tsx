"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Switch } from "@/components/ui/switch";
import type { ActionResult } from "@/lib/action-result";

/** Interruttore "scorre / congelato" che salva subito (con rollback in caso di errore). */
export function TimelineSwitch({
  running,
  action,
  label = true,
}: {
  running: boolean;
  action: (running: boolean) => Promise<ActionResult>;
  label?: boolean;
}) {
  const router = useRouter();
  const [value, setValue] = useState(running);
  const [isPending, startTransition] = useTransition();

  // Se il server cambia il valore (refresh), lo rispecchio senza useEffect.
  const [seen, setSeen] = useState(running);
  if (seen !== running) {
    setSeen(running);
    setValue(running);
  }

  function handleChange(next: boolean) {
    setValue(next);
    startTransition(async () => {
      const result = await action(next);
      if (!result.success) {
        setValue(!next);
        toast.error(result.error);
        return;
      }
      toast.success(next ? "I giorni scorrono" : "Giorni congelati");
      router.refresh();
    });
  }

  return (
    <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
      <Switch checked={value} onCheckedChange={handleChange} disabled={isPending} aria-label="Scorre o congelato" />
      {label && <span className="w-16">{value ? "Scorre" : "Congelato"}</span>}
    </label>
  );
}
