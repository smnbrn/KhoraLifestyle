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
import { eventSchema, type EventInput } from "@/schemas/event.schema";
import { saveEvent } from "./actions";

const NONE = "none";
const EVENT_TYPE_LABELS: Record<string, string> = { meeting: "Incontro", reminder: "Promemoria", other: "Altro" };

export function EventFormDialog({
  trigger,
  defaultDate,
  clients,
  projects,
}: {
  trigger: ReactNode;
  defaultDate?: string;
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
  } = useForm<EventInput>({
    resolver: zodResolver(eventSchema),
    defaultValues: { eventType: "other", eventDate: defaultDate ?? new Date().toISOString().slice(0, 10) },
  });

  function onSubmit(values: EventInput) {
    startTransition(async () => {
      const formData = new FormData();
      Object.entries(values).forEach(([key, value]) => formData.set(key, value === NONE ? "" : (value ?? "")));

      const result = await saveEvent(formData);
      if (result.success) {
        toast.success("Evento creato");
        setOpen(false);
        reset();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) reset({ eventType: "other", eventDate: defaultDate ?? new Date().toISOString().slice(0, 10) });
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <DialogHeader>
            <DialogTitle>Nuovo evento</DialogTitle>
            <DialogDescription>Le scadenze di task e fatture appaiono automaticamente in calendario.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titolo *</Label>
              <Input id="title" {...register("title")} />
              {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="eventDate">Data *</Label>
                <Input id="eventDate" type="date" {...register("eventDate")} />
                {errors.eventDate && <p className="text-sm text-destructive">{errors.eventDate.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="eventTime">Ora</Label>
                <Input id="eventTime" type="time" {...register("eventTime")} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tipo</Label>
              <Controller
                name="eventType"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrizione</Label>
              <Textarea id="description" rows={2} {...register("description")} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Progetto collegato</Label>
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
              <div className="space-y-2">
                <Label>Cliente collegato</Label>
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
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Salvataggio…" : "Crea evento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
