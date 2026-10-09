"use client";

import { useState, useTransition, type ReactNode } from "react";
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
import { transactionSchema, type TransactionInput } from "@/schemas/transaction.schema";
import { saveTransaction } from "./actions";
import { CategoryQuickAdd } from "./category-quick-add";

const NONE = "none";
const NEW_CATEGORY = "__new__";

type Category = { id: string; name: string; type: string };

export function TransactionFormDialog({
  trigger,
  categories: initialCategories,
  clients,
  projects,
}: {
  trigger: ReactNode;
  categories: Category[];
  clients: { id: string; name: string }[];
  projects: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState(initialCategories);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<TransactionInput>({
    resolver: zodResolver(transactionSchema),
    defaultValues: { type: "expense", transactionDate: new Date().toISOString().slice(0, 10) },
  });

  const type = watch("type");
  const filteredCategories = categories.filter((c) => c.type === type);

  function onSubmit(values: TransactionInput) {
    startTransition(async () => {
      const formData = new FormData();
      Object.entries(values).forEach(([key, value]) => formData.set(key, value === NONE ? "" : (value ?? "")));

      const result = await saveTransaction(formData);
      if (result.success) {
        toast.success("Movimento registrato");
        setOpen(false);
        reset();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        <DialogContent>
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <DialogHeader>
              <DialogTitle>Nuovo movimento</DialogTitle>
              <DialogDescription>Registra un&apos;entrata o un&apos;uscita manuale.</DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={type === "income" ? "default" : "outline"}
                  onClick={() => setValue("type", "income")}
                >
                  Entrata
                </Button>
                <Button
                  type="button"
                  variant={type === "expense" ? "default" : "outline"}
                  onClick={() => setValue("type", "expense")}
                >
                  Uscita
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Categoria</Label>
                <Controller
                  name="categoryId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value || NONE}
                      onValueChange={(v) => (v === NEW_CATEGORY ? setQuickAddOpen(true) : field.onChange(v))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Nessuna" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE}>Nessuna</SelectItem>
                        {filteredCategories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                        <SelectItem value={NEW_CATEGORY}>+ Nuova categoria…</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrizione</Label>
                <Input id="description" {...register("description")} />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="amount">Importo (€) *</Label>
                  <Input id="amount" type="number" step="0.01" min="0.01" {...register("amount")} />
                  {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="transactionDate">Data *</Label>
                  <Input id="transactionDate" type="date" {...register("transactionDate")} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Metodo di pagamento</Label>
                <Controller
                  name="paymentMethod"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value || NONE} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Non specificato" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE}>Non specificato</SelectItem>
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

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Cliente</Label>
                  <Controller
                    name="clientId"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value || NONE} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Nessuno" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={NONE}>Nessuno</SelectItem>
                          {clients.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Progetto</Label>
                  <Controller
                    name="projectId"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value || NONE} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Nessuno" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={NONE}>Nessuno</SelectItem>
                          {projects.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name}
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
                {isPending ? "Salvataggio…" : "Registra movimento"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <CategoryQuickAdd
        type={type}
        open={quickAddOpen}
        onOpenChange={setQuickAddOpen}
        onCreated={(category) => {
          setCategories((prev) => [...prev, { ...category, type }]);
          setValue("categoryId", category.id);
        }}
      />
    </>
  );
}
