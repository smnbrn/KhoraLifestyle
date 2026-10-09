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
import { commissionSchema, type CommissionInput } from "@/schemas/commission.schema";
import { saveCommission } from "./actions";

const NONE = "none";

export function CommissionFormDialog({
  trigger,
  clients,
  projects,
}: {
  trigger: ReactNode;
  clients: { id: string; name: string }[];
  projects: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<CommissionInput>({
    resolver: zodResolver(commissionSchema),
    defaultValues: { status: "to_pay", commissionDate: new Date().toISOString().slice(0, 10) },
  });

  function onSubmit(values: CommissionInput) {
    startTransition(async () => {
      const formData = new FormData();
      Object.entries(values).forEach(([key, value]) => formData.set(key, value === NONE ? "" : (value ?? "")));

      const result = await saveCommission(formData);
      if (result.success) {
        toast.success("Commissione creata");
        setOpen(false);
        reset();
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
            <DialogTitle>Nuova commissione</DialogTitle>
            <DialogDescription>Segnarla come pagata genererà anche la relativa uscita.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="description">Descrizione *</Label>
              <Input id="description" {...register("description")} />
              {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="amount">Importo (€) *</Label>
                <Input id="amount" type="number" step="0.01" min="0" {...register("amount")} />
                {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="percentage">Percentuale (%)</Label>
                <Input id="percentage" type="number" step="0.01" min="0" max="100" {...register("percentage")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="commissionDate">Data *</Label>
                <Input id="commissionDate" type="date" {...register("commissionDate")} />
              </div>
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
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Salvataggio…" : "Crea commissione"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
