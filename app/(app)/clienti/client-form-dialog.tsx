"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useForm } from "react-hook-form";
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
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { clientSchema, type ClientInput } from "@/schemas/client.schema";
import { saveClient } from "./actions";

type ClientDefaults = Partial<ClientInput> & { id?: string };

export function ClientFormDialog({
  trigger,
  onClose,
  client,
}: {
  trigger: ReactNode;
  /** chiamata quando la finestra si chiude (serve a chiudere anche il menu da cui è stata aperta) */
  onClose?: () => void;
  client?: ClientDefaults;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const isEdit = Boolean(client?.id);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClientInput>({
    resolver: zodResolver(clientSchema),
    defaultValues: { country: "Italia", ...client },
  });

  // Il form viene creato una volta sola: dopo un salvataggio i campi resterebbero fermi ai valori
  // vecchi e un nuovo salvataggio li riscriverebbe. A ogni apertura lo riporto ai dati attuali.
  function handleOpenChange(next: boolean) {
    if (next) reset({ country: "Italia", ...client });
    setOpen(next);
    if (!next) onClose?.();
  }

  function onSubmit(values: ClientInput) {
    startTransition(async () => {
      const formData = new FormData();
      if (client?.id) formData.set("id", client.id);
      Object.entries(values).forEach(([key, value]) => formData.set(key, value ?? ""));

      const result = await saveClient(formData);
      if (result.success) {
        toast.success(isEdit ? "Cliente aggiornato" : "Cliente creato");
        handleOpenChange(false);
        if (!isEdit) reset();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <DialogHeader>
            <DialogTitle>{isEdit ? "Modifica cliente" : "Nuovo cliente"}</DialogTitle>
            <DialogDescription>
              {isEdit ? "Aggiorna i dati del cliente." : "Inserisci i dati del nuovo cliente."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="name">Nome / Ragione sociale *</Label>
                <Input id="name" {...register("name")} />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="referentName">Referente</Label>
                <Input id="referentName" {...register("referentName")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...register("email")} />
                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefono</Label>
                <Input id="phone" {...register("phone")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vatNumber">Partita IVA</Label>
                <Input id="vatNumber" {...register("vatNumber")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="taxCode">Codice fiscale</Label>
                <Input id="taxCode" {...register("taxCode")} />
              </div>
            </div>

            <Separator />

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="address">Indirizzo</Label>
                <Input id="address" {...register("address")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Città</Label>
                <Input id="city" {...register("city")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postalCode">CAP</Label>
                <Input id="postalCode" {...register("postalCode")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="province">Provincia</Label>
                <Input id="province" {...register("province")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Paese</Label>
                <Input id="country" {...register("country")} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Note</Label>
              <Textarea id="notes" rows={3} {...register("notes")} />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Salvataggio…" : isEdit ? "Salva modifiche" : "Crea cliente"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
