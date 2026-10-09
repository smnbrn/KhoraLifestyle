"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TimelineSwitch } from "@/components/shared/timeline-switch";
import { cn, formatDate } from "@/lib/utils";
import { previewEnd } from "@/lib/timeline";
import { phaseSchema, type PhaseInput } from "@/schemas/phase.schema";
import { removePhase, savePhase, togglePhaseCompleted, togglePhaseRunning } from "./phase-actions";

export type PhaseView = {
  id: string;
  name: string;
  startDate: string;
  durationDays: number;
  completed: boolean;
  running: boolean;
  /** fine calcolata sul server (inizio + giorni + giorni congelati) */
  end: string;
  frozenTotal: number;
  late: boolean;
};

function PhaseDialog({
  projectId,
  phase,
  open,
  onOpenChange,
}: {
  projectId: string;
  phase: PhaseView | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<PhaseInput>({
    resolver: zodResolver(phaseSchema),
    defaultValues: phase
      ? { name: phase.name, startDate: phase.startDate, durationDays: String(phase.durationDays) }
      : { name: "", startDate: "", durationDays: "" },
  });
  const end = previewEnd(watch("startDate"), watch("durationDays"));

  function onSubmit(values: PhaseInput) {
    startTransition(async () => {
      const result = await savePhase(projectId, phase?.id ?? null, values);
      if (result.success) {
        toast.success(phase ? "Macro attività aggiornata" : "Macro attività aggiunta");
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <DialogHeader>
            <DialogTitle>{phase ? "Modifica macro attività" : "Nuova macro attività"}</DialogTitle>
            <DialogDescription>Una fase del progetto: compare come barra nel diagramma di Gantt.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="phase-name">Nome *</Label>
              <Input id="phase-name" {...register("name")} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phase-start">Data di inizio *</Label>
                <Input id="phase-start" type="date" {...register("startDate")} />
                {errors.startDate && <p className="text-sm text-destructive">{errors.startDate.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phase-days">Durata (giorni) *</Label>
                <Input id="phase-days" type="number" min="1" step="1" inputMode="numeric" {...register("durationDays")} />
                {errors.durationDays && <p className="text-sm text-destructive">{errors.durationDays.message}</p>}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {end ? (
                <>
                  Scadenza calcolata: <span className="font-medium text-foreground">{formatDate(end)}</span>
                </>
              ) : (
                "Imposta inizio e giorni per calcolare la scadenza."
              )}
            </p>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Salvataggio…" : phase ? "Salva modifiche" : "Aggiungi"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function PhasesManager({ projectId, phases }: { projectId: string; phases: PhaseView[] }) {
  const router = useRouter();
  const [dialog, setDialog] = useState<{ open: boolean; phase: PhaseView | null; key: number }>({
    open: false,
    phase: null,
    key: 0,
  });
  const [, startTransition] = useTransition();

  function openDialog(phase: PhaseView | null) {
    // key nuova = form ricreato con i valori giusti
    setDialog((d) => ({ open: true, phase, key: d.key + 1 }));
  }

  function toggleCompleted(phase: PhaseView, completed: boolean) {
    startTransition(async () => {
      const result = await togglePhaseCompleted(projectId, phase.id, completed);
      if (!result.success) toast.error(result.error);
      router.refresh();
    });
  }

  function handleDelete(phase: PhaseView) {
    if (!window.confirm(`Eliminare la macro attività "${phase.name}"?`)) return;
    startTransition(async () => {
      const result = await removePhase(projectId, phase.id);
      if (result.success) toast.success("Macro attività eliminata");
      else toast.error(result.error);
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Spunta una macro attività quando è completata: fa avanzare il progresso reale del progetto.
        </p>
        <Button size="sm" onClick={() => openDialog(null)}>
          <Plus />
          Macro attività
        </Button>
      </div>

      {phases.length > 0 && (
        <ul className="divide-y rounded-lg border">
          {phases.map((phase) => (
            <li key={phase.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 p-3 text-sm">
              <Checkbox
                checked={phase.completed}
                onCheckedChange={(v) => toggleCompleted(phase, v === true)}
                aria-label="Macro attività completata"
              />
              <div className="min-w-0 flex-1">
                <p className={cn("truncate font-medium", phase.completed && "text-muted-foreground line-through")}>
                  {phase.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(phase.startDate)} → {formatDate(phase.end)} · {phase.durationDays} gg
                  {phase.frozenTotal > 0 && ` + ${phase.frozenTotal} congelati`}
                  {phase.late && !phase.completed && <span className="ml-2 font-medium text-destructive">in ritardo</span>}
                </p>
              </div>
              {!phase.completed && (
                <TimelineSwitch running={phase.running} action={togglePhaseRunning.bind(null, projectId, phase.id)} />
              )}
              <div className="flex items-center">
                <Button variant="ghost" size="icon" className="size-8" onClick={() => openDialog(phase)}>
                  <Pencil />
                  <span className="sr-only">Modifica</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDelete(phase)}
                >
                  <Trash2 />
                  <span className="sr-only">Elimina</span>
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <PhaseDialog
        key={dialog.key}
        projectId={projectId}
        phase={dialog.phase}
        open={dialog.open}
        onOpenChange={(open) => setDialog((d) => ({ ...d, open }))}
      />
    </div>
  );
}
