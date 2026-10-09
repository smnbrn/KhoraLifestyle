"use client";

import { useState, useTransition, type ReactNode } from "react";
import {
  useForm,
  useFieldArray,
  Controller,
  type Control,
  type UseFormRegister,
  type UseFormWatch,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

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
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { PROJECT_STATUS, PRIORITY } from "@/lib/constants";
import { projectSchema, type ProjectInput } from "@/schemas/project.schema";
import { TimelineFields } from "@/components/shared/timeline-fields";
import type { TimelineFormValues } from "@/schemas/timeline.schema";
import { saveProject } from "./actions";

type ProjectDefaults = Partial<ProjectInput> & { id?: string };

export function ProjectFormDialog({
  trigger,
  project,
  clients,
  legacyEnd,
}: {
  trigger: ReactNode;
  project?: ProjectDefaults;
  clients: { id: string; name: string }[];
  legacyEnd?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const isEdit = Boolean(project?.id);

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm<ProjectInput>({
    resolver: zodResolver(projectSchema),
    defaultValues: { status: "planned", priority: "medium", customFields: [], timelineRunning: true, ...project },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "customFields" });

  function onSubmit(values: ProjectInput) {
    startTransition(async () => {
      const formData = new FormData();
      if (project?.id) formData.set("id", project.id);
      const { customFields, ...rest } = values;
      Object.entries(rest).forEach(([key, value]) => formData.set(key, value == null ? "" : String(value)));
      formData.set("customFieldsJson", JSON.stringify(customFields ?? []));

      const result = await saveProject(formData);
      if (result.success) {
        toast.success(isEdit ? "Progetto aggiornato" : "Progetto creato");
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
            <DialogTitle>{isEdit ? "Modifica progetto" : "Nuovo progetto"}</DialogTitle>
            <DialogDescription>
              {isEdit ? "Aggiorna i dati del progetto." : "Inserisci i dati del nuovo progetto."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome progetto *</Label>
              <Input id="name" {...register("name")} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Cliente *</Label>
              <Controller
                name="clientId"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona un cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.clientId && <p className="text-sm text-destructive">{errors.clientId.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrizione</Label>
              <Textarea id="description" rows={2} {...register("description")} />
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
                        {Object.entries(PROJECT_STATUS).map(([value, label]) => (
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
              <Label htmlFor="actualEndDate">Fine effettiva</Label>
              <Input id="actualEndDate" type="date" {...register("actualEndDate")} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="budget">Budget (€)</Label>
                <Input id="budget" type="number" step="0.01" min="0" {...register("budget")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="projectValue">Valore progetto (€)</Label>
                <Input id="projectValue" type="number" step="0.01" min="0" {...register("projectValue")} />
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Campi personalizzati</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => append({ label: "", value: "" })}>
                  <Plus />
                  Aggiungi campo
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Per informazioni in più su progetti particolari — es. &quot;Numero commessa&quot;, &quot;Referente tecnico&quot;.
              </p>
              {fields.length > 0 && (
                <div className="space-y-2">
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex items-end gap-2">
                      <div className="flex-1 space-y-1">
                        <Label className="text-xs text-muted-foreground">Nome campo</Label>
                        <Input placeholder="es. Numero commessa" {...register(`customFields.${index}.label`)} />
                      </div>
                      <div className="flex-1 space-y-1">
                        <Label className="text-xs text-muted-foreground">Valore</Label>
                        <Input {...register(`customFields.${index}.value`)} />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Note</Label>
              <Textarea id="notes" rows={2} {...register("notes")} />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Salvataggio…" : isEdit ? "Salva modifiche" : "Crea progetto"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
