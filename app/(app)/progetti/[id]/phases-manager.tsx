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
  /** se valorizzato è una micro attività della macro attività con quell'id */
  parentId: string | null;
};

function PhaseDialog({
  projectId,
  phase,
  parent,
  open,
  onOpenChange,
}: {
  projectId: string;
  phase: PhaseView | null;
  /** macro attività a cui aggiungere una nuova micro attività (solo in creazione) */
  parent: PhaseView | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const isMicro = !!parent || !!phase?.parentId;
  const kind = isMicro ? "micro attività" : "macro attività";
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
      const result = await savePhase(projectId, phase?.id ?? null, values, parent?.id ?? null);
      if (result.success) {
        toast.success(phase ? `Aggiornata: ${kind}` : `Aggiunta: ${kind}`);
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
            <DialogTitle>{phase ? `Modifica ${kind}` : `Nuova ${kind}`}</DialogTitle>
            <DialogDescription>
              {isMicro
                ? `Un passo più piccolo${parent ? ` dentro «${parent.name}»` : ""}: compare sotto la sua macro attività nel Gantt.`
                : "Una fase del progetto: compare come barra nel diagramma di Gantt."}
            </DialogDescription>
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
  const [dialog, setDialog] = useState<{
    open: boolean;
    phase: PhaseView | null;
    parent: PhaseView | null;
    key: number;
  }>({
    open: false,
    phase: null,
    parent: null,
    key: 0,
  });
  const [, startTransition] = useTransition();

  // macro in ordine, ciascuna seguita dalle sue micro
  const ids = new Set(phases.map((p) => p.id));
  const rows: { phase: PhaseView; micro: boolean }[] = [];
  for (const macro of phases.filter((p) => !p.parentId || !ids.has(p.parentId))) {
    rows.push({ phase: macro, micro: false });
    phases
      .filter((p) => p.parentId === macro.id)
      .forEach((m) => rows.push({ phase: m, micro: true }));
  }

  function openDialog(phase: PhaseView | null, parent: PhaseView | null = null) {
    // key nuova = form ricreato con i valori giusti
    setDialog((d) => ({ open: true, phase, parent, key: d.key + 1 }));
  }

  function toggleCompleted(phase: PhaseView, completed: boolean) {
    startTransition(async () => {
      const result = await togglePhaseCompleted(projectId, phase.id, completed);
      if (!result.success) toast.error(result.error);
      router.refresh();
    });
  }

  function handleDelete(phase: PhaseView) {
    const micros = phases.filter((p) => p.parentId === phase.id).length;
    const extra = micros > 0 ? ` Verranno eliminate anche le sue ${micros} micro attività.` : "";
    if (!window.confirm(`Eliminare "${phase.name}"?${extra}`)) return;
    startTransition(async () => {
      const result = await removePhase(projectId, phase.id);
      if (result.success) toast.success("Attività eliminata");
      else toast.error(result.error);
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Spunta una macro attività quando è completata: fa avanzare il progresso reale del progetto. Dentro ogni macro
          puoi aggiungere le micro attività (i passi più piccoli).
        </p>
        <Button size="sm" onClick={() => openDialog(null)}>
          <Plus />
          Macro attività
        </Button>
      </div>

      {phases.length > 0 && (
        <ul className="divide-y rounded-lg border">
          {rows.map(({ phase, micro }) => (
            <li
              key={phase.id}
              className={cn(
                "flex flex-wrap items-center gap-x-4 gap-y-2 p-3 text-sm",
                micro && "bg-muted/30 py-2 pl-9 text-[13px]"
              )}
            >
              <Checkbox
                checked={phase.completed}
                onCheckedChange={(v) => toggleCompleted(phase, v === true)}
                aria-label={micro ? "Micro attività completata" : "Macro attività completata"}
              />
              <div className="min-w-0 flex-1">
                <p className={cn("truncate font-medium", phase.completed && "text-muted-foreground line-through")}>
                  {micro && <span className="mr-1.5 text-muted-foreground/60">└</span>}
                  {phase.name}
                  <span className="ml-2 rounded bg-muted px-1.5 py-0.5 align-middle text-[10px] font-normal uppercase tracking-wide text-muted-foreground">
                    {micro ? "micro" : "macro"}
                  </span>
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
                {!micro && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs text-muted-foreground"
                    onClick={() => openDialog(null, phase)}
                  >
                    <Plus />
                    Micro
                  </Button>
                )}
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
        parent={dialog.parent}
        open={dialog.open}
        onOpenChange={(open) => setDialog((d) => ({ ...d, open }))}
      />
    </div>
  );
}
