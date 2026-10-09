"use client";

import { Controller, type Control, type UseFormRegister, type UseFormWatch } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { formatDate } from "@/lib/utils";
import { previewEnd } from "@/lib/timeline";
import type { TimelineFormValues } from "@/schemas/timeline.schema";

/**
 * Blocco di campi "tempo a giorni": data di inizio + numero di giorni + interruttore
 * scorre/congelato. Mostra la scadenza che ne risulta.
 */
export function TimelineFields({
  register,
  control,
  watch,
  errors,
  legacyEnd,
}: {
  register: UseFormRegister<TimelineFormValues>;
  control: Control<TimelineFormValues>;
  watch: UseFormWatch<TimelineFormValues>;
  errors?: { durationDays?: { message?: string } };
  /** scadenza a data fissa preesistente (dati vecchi), mostrata finché non si imposta una durata */
  legacyEnd?: string | null;
}) {
  const start = watch("startDate");
  const days = watch("durationDays");
  const running = watch("timelineRunning");
  const end = previewEnd(start, days);

  return (
    <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="startDate">Data di inizio</Label>
          <Input id="startDate" type="date" {...register("startDate")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="durationDays">Durata (giorni)</Label>
          <Input id="durationDays" type="number" min="0" step="1" inputMode="numeric" {...register("durationDays")} />
          {errors?.durationDays && <p className="text-sm text-destructive">{errors.durationDays.message}</p>}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">{running ? "I giorni scorrono" : "Giorni congelati"}</p>
          <p className="text-xs text-muted-foreground">
            {running
              ? "Il tempo avanza: la scadenza resta ferma."
              : "Il tempo è fermo: la scadenza slitta di un giorno ogni giorno."}
          </p>
        </div>
        <Controller
          name="timelineRunning"
          control={control}
          render={({ field }) => (
            <Switch checked={field.value} onCheckedChange={field.onChange} aria-label="I giorni scorrono" />
          )}
        />
      </div>

      <p className="text-xs text-muted-foreground">
        {end ? (
          <>
            Scadenza calcolata: <span className="font-medium text-foreground">{formatDate(end)}</span>
          </>
        ) : legacyEnd ? (
          <>
            Scadenza attuale (data fissa): <span className="font-medium text-foreground">{formatDate(legacyEnd)}</span> —
            imposta inizio e giorni per passare al calcolo a giorni.
          </>
        ) : (
          "Imposta inizio e giorni per calcolare la scadenza."
        )}
      </p>
    </div>
  );
}
