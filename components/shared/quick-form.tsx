"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ActionResult } from "@/lib/action-result";

export type QuickField = {
  name: string;
  label: string;
  type?: "text" | "number" | "date" | "select" | "textarea" | "email";
  options?: { value: string; label: string }[];
  required?: boolean;
  placeholder?: string;
  step?: string;
  /** larghezza: "half" affianca due campi */
  width?: "full" | "half";
};

/** Dialog di creazione/modifica guidato da una lista di campi. Invia un FormData alla server action. */
export function QuickForm({
  trigger,
  title,
  description,
  fields,
  values = {},
  hidden = {},
  action,
  submitLabel = "Salva",
  successMessage = "Salvato",
}: {
  trigger: ReactNode;
  title: string;
  description?: string;
  fields: QuickField[];
  values?: Record<string, string | number | null | undefined>;
  hidden?: Record<string, string>;
  action: (formData: FormData) => Promise<ActionResult<unknown>>;
  submitLabel?: string;
  successMessage?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [selects, setSelects] = useState<Record<string, string>>({});

  function initialSelect(f: QuickField) {
    const v = values[f.name];
    return v != null && v !== "" ? String(v) : (f.options?.[0]?.value ?? "");
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    for (const [k, v] of Object.entries(hidden)) fd.set(k, v);
    for (const f of fields) {
      if (f.type === "select") fd.set(f.name, selects[f.name] ?? initialSelect(f));
    }
    startTransition(async () => {
      const result = await action(fd);
      if (result.success) {
        toast.success(successMessage);
        setOpen(false);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) setSelects({});
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
          <div className="grid gap-4 py-4 sm:grid-cols-2">
            {fields.map((f) => {
              const id = `qf-${f.name}`;
              const def = values[f.name];
              return (
                <div key={f.name} className={f.width === "half" ? "space-y-2" : "space-y-2 sm:col-span-2"}>
                  <Label htmlFor={id}>
                    {f.label}
                    {f.required ? " *" : ""}
                  </Label>
                  {f.type === "select" ? (
                    <Select
                      value={selects[f.name] ?? initialSelect(f)}
                      onValueChange={(v) => setSelects((s) => ({ ...s, [f.name]: v }))}
                    >
                      <SelectTrigger id={id}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {f.options?.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : f.type === "textarea" ? (
                    <Textarea id={id} name={f.name} rows={2} defaultValue={def ?? ""} placeholder={f.placeholder} />
                  ) : (
                    <Input
                      id={id}
                      name={f.name}
                      type={f.type ?? "text"}
                      step={f.type === "number" ? (f.step ?? "any") : undefined}
                      defaultValue={def ?? ""}
                      required={f.required}
                      placeholder={f.placeholder}
                    />
                  )}
                </div>
              );
            })}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Salvataggio…" : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Pulsante con conferma per eliminare. */
export function DeleteButton({
  action,
  label = "Elimina",
  what = "questo elemento",
  iconOnly = true,
}: {
  action: () => Promise<ActionResult<unknown>>;
  label?: string;
  what?: string;
  iconOnly?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size={iconOnly ? "icon" : "sm"}
        className="text-muted-foreground hover:text-destructive"
        aria-label={label}
        onClick={() => setOpen(true)}
      >
        <Trash2 />
        {!iconOnly && label}
      </Button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare {what}?</AlertDialogTitle>
            <AlertDialogDescription>L&apos;operazione non si può annullare.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              disabled={isPending}
              onClick={(e) => {
                e.preventDefault();
                startTransition(async () => {
                  const r = await action();
                  if (r.success) {
                    toast.success("Eliminato");
                    setOpen(false);
                    router.refresh();
                  } else toast.error(r.error);
                });
              }}
            >
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/** Pulsante generico che esegue una server action e ricarica i dati. */
export function ActionButton({
  action,
  children,
  variant = "outline",
  size = "sm",
  successMessage,
}: {
  action: () => Promise<ActionResult<unknown>>;
  children: ReactNode;
  variant?: "outline" | "ghost" | "default" | "secondary";
  size?: "sm" | "default" | "icon";
  successMessage?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          const r = await action();
          if (r.success) {
            if (successMessage) toast.success(successMessage);
            router.refresh();
          } else toast.error(r.error);
        })
      }
    >
      {children}
    </Button>
  );
}
