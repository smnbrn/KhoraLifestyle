"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CONTACT_KIND } from "@/lib/constants/second-brain";
import { contactSchema, type ContactInput } from "@/schemas/contact.schema";
import { saveContact } from "./actions";

const NONE = "none";

export function ContactFormDialog({
  trigger,
  contact,
  clients,
}: {
  trigger: ReactNode;
  contact?: Partial<ContactInput> & { id?: string };
  clients: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const isEdit = Boolean(contact?.id);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: { kind: "other", ...contact },
  });

  function onSubmit(values: ContactInput) {
    startTransition(async () => {
      const formData = new FormData();
      if (contact?.id) formData.set("id", contact.id);
      Object.entries(values).forEach(([key, value]) => formData.set(key, value === NONE || value == null ? "" : String(value)));
      const result = await saveContact(formData);
      if (result.success) {
        toast.success(isEdit ? "Contatto aggiornato" : "Contatto aggiunto");
        setOpen(false);
        if (!isEdit) reset();
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
            <DialogTitle>{isEdit ? "Modifica contatto" : "Nuovo contatto"}</DialogTitle>
            <DialogDescription>Le persone in rubrica si possono coinvolgere nei progetti.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="c-name">Nome *</Label>
                <Input id="c-name" {...register("name")} />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Controller
                  name="kind"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(CONTACT_KIND).map(([value, label]) => (
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
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="c-company">Azienda</Label>
                <Input id="c-company" {...register("company")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="c-role">Ruolo</Label>
                <Input id="c-role" {...register("role")} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="c-email">Email</Label>
                <Input id="c-email" type="email" {...register("email")} />
                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="c-phone">Telefono</Label>
                <Input id="c-phone" {...register("phone")} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Collegato al cliente</Label>
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
              <Label htmlFor="c-notes">Note</Label>
              <Textarea id="c-notes" rows={2} {...register("notes")} />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Salvataggio…" : isEdit ? "Salva modifiche" : "Aggiungi"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
