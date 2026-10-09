"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useForm, Controller, type Control, type UseFormRegister, type UseFormWatch } from "react-hook-form";
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
import { TASK_STATUS, PRIORITY } from "@/lib/constants";
import { taskSchema, type TaskInput } from "@/schemas/task.schema";
import { TimelineFields } from "@/components/shared/timeline-fields";
import type { TimelineFormValues } from "@/schemas/timeline.schema";
import { saveTask } from "./actions";

const NONE = "none";

type TaskDefaults = Partial<TaskInput> & { id?: string };

export function TaskFormDialog({
  trigger,
  task,
  clients,
  projects,
  legacyEnd,
}: {
  trigger: ReactNode;
  task?: TaskDefaults;
  clients: { id: string; name: string }[];
  projects: { id: string; name: string }[];
  legacyEnd?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const isEdit = Boolean(task?.id);

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm<TaskInput>({
    resolver: zodResolver(taskSchema),
    defaultValues: { status: "todo", priority: "medium", timelineRunning: true, ...task },
  });

  function onSubmit(values: TaskInput) {
    startTransition(async () => {
      const formData = new FormData();
      if (task?.id) formData.set("id", task.id);
      Object.entries(values).forEach(([key, value]) => {
        formData.set(key, value === NONE || value == null ? "" : String(value));
      });

      const result = await saveTask(formData);
      if (result.success) {
        toast.success(isEdit ? "Task aggiornato" : "Task creato");
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
            <DialogTitle>{isEdit ? "Modifica task" : "Nuovo task"}</DialogTitle>
            <DialogDescription>
              {isEdit ? "Aggiorna i dati del task." : "Inserisci i dati del nuovo task."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titolo *</Label>
              <Input id="title" {...register("title")} />
              {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrizione</Label>
              <Textarea id="description" rows={2} {...register("description")} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
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
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Stato</Label>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
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
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label>Priorità</Label>
                <Controller
                  name="priority"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(PRIORITY).map(([value, label]) => (
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

            <TimelineFields
              register={register as unknown as UseFormRegister<TimelineFormValues>}
              control={control as unknown as Control<TimelineFormValues>}
              watch={watch as unknown as UseFormWatch<TimelineFormValues>}
              errors={errors}
              legacyEnd={legacyEnd}
            />

            <div className="space-y-2">
              <Label htmlFor="notes">Note</Label>
              <Textarea id="notes" rows={2} {...register("notes")} />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Salvataggio…" : isEdit ? "Salva modifiche" : "Crea task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
