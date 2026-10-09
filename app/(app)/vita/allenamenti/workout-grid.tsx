"use client";

import { useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { toggleWorkoutDay } from "../actions";

const WEEKDAYS = ["L", "M", "M", "G", "V", "S", "D"];

/** Calendario del mese: un tocco su un giorno = allenato / non allenato. */
export function WorkoutGrid({
  year,
  month,
  trained,
  today,
}: {
  year: number;
  month: number; // 1-12
  trained: string[];
  today: string;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic(new Set(trained), (state, date: string) => {
    const next = new Set(state);
    if (next.has(date)) next.delete(date);
    else next.add(date);
    return next;
  });

  const daysInMonth = new Date(year, month, 0).getDate();
  const offset = (new Date(year, month - 1, 1).getDay() + 6) % 7; // lunedì = 0
  const pad = (n: number) => String(n).padStart(2, "0");

  function toggle(date: string) {
    startTransition(async () => {
      setOptimistic(date);
      const r = await toggleWorkoutDay(date);
      if (!r.success) toast.error(r.error);
      router.refresh();
    });
  }

  return (
    <div className="max-w-md">
      <div className="mb-2 grid grid-cols-7 gap-1.5 text-center text-xs text-muted-foreground">
        {WEEKDAYS.map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {Array.from({ length: offset }).map((_, i) => (
          <span key={`o${i}`} />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
          const date = `${year}-${pad(month)}-${pad(day)}`;
          const done = optimistic.has(date);
          const future = date > today;
          return (
            <button
              key={date}
              type="button"
              onClick={() => toggle(date)}
              disabled={future}
              aria-pressed={done}
              aria-label={`${day}/${month}/${year}${done ? " — allenato" : ""}`}
              className={cn(
                "aspect-square rounded-md border text-sm transition-colors",
                done ? "border-success bg-success/20 text-success" : "border-border text-muted-foreground hover:border-primary/60",
                date === today && !done && "border-primary text-foreground",
                future && "cursor-not-allowed opacity-40"
              )}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
