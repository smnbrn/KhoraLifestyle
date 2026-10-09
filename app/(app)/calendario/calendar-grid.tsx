"use client";

import { useState } from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  format,
} from "date-fns";
import { it } from "date-fns/locale";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { removeEvent } from "./actions";
import type { CalendarItem } from "@/services/calendar.service";

export const CALENDAR_TYPE_DOT: Record<CalendarItem["type"], string> = {
  task: "bg-primary",
  invoice: "bg-warning",
  project: "bg-muted-foreground",
  phase: "bg-sky-400",
  life: "bg-violet-400",
  trip: "bg-orange-400",
  event: "bg-success",
};

export const CALENDAR_TYPE_LABEL: Record<CalendarItem["type"], string> = {
  task: "Task",
  invoice: "Fattura",
  project: "Progetto",
  phase: "Macro attività",
  life: "Vita",
  trip: "Viaggio",
  event: "Evento",
};

const TYPE_DOT = CALENDAR_TYPE_DOT;
const TYPE_LABEL = CALENDAR_TYPE_LABEL;

export function CalendarGrid({
  monthDate,
  items,
  compact = false,
}: {
  monthDate: Date;
  items: CalendarItem[];
  compact?: boolean;
}) {
  const router = useRouter();
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const gridStart = startOfWeek(startOfMonth(monthDate), { weekStartsOn: 1 });
  const gridEnd = endOfWeek(endOfMonth(monthDate), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const itemsByDay = new Map<string, CalendarItem[]>();
  for (const item of items) {
    const list = itemsByDay.get(item.date) ?? [];
    list.push(item);
    itemsByDay.set(item.date, list);
  }

  async function handleDelete(id: string) {
    const eventId = id.replace("event-", "");
    setPendingDelete(id);
    const result = await removeEvent(eventId);
    setPendingDelete(null);
    if (result.success) {
      toast.success("Evento eliminato");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  const weekdayLabels = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

  return (
    <div className="overflow-hidden rounded-lg border">
      <div className="grid grid-cols-7 border-b bg-muted/40 text-xs font-medium text-muted-foreground">
        {weekdayLabels.map((label) => (
          <div key={label} className="px-2 py-2 text-center">
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const dayItems = itemsByDay.get(key) ?? [];
          const inMonth = isSameMonth(day, monthDate);

          return (
            <div
              key={key}
              className={cn(
                compact ? "min-h-20 border-r border-b p-1 last:border-r-0" : "min-h-24 border-r border-b p-1.5 last:border-r-0",
                !inMonth && "bg-muted/20 text-muted-foreground"
              )}
            >
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    "flex size-6 items-center justify-center rounded-full text-xs",
                    isToday(day) && "bg-primary font-medium text-primary-foreground"
                  )}
                >
                  {format(day, "d")}
                </span>
              </div>
              <div className="mt-1 space-y-0.5">
                {dayItems.slice(0, 3).map((item) => (
                  <Popover key={item.id}>
                    <PopoverTrigger asChild>
                      <button className="flex w-full items-center gap-1 truncate rounded px-1 py-0.5 text-left text-[11px] hover:bg-accent">
                        <span className={cn("size-1.5 shrink-0 rounded-full", TYPE_DOT[item.type], item.overdue && "ring-2 ring-destructive/60")} />
                        <span className="truncate">{item.title}</span>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64" align="start">
                      <p className="text-xs text-muted-foreground">
                        {TYPE_LABEL[item.type]} · {format(new Date(item.date), "d MMMM yyyy", { locale: it })}
                      </p>
                      <p className={cn("mt-1 text-sm font-medium", item.overdue && "text-destructive")}>{item.title}</p>
                      {item.subtitle && <p className="text-xs text-muted-foreground">{item.subtitle}</p>}
                      {item.overdue && <p className="mt-1 text-xs text-destructive">Scaduta</p>}
                      {item.href && item.type !== "event" && (
                        <Link href={item.href} className="mt-2 inline-block text-xs text-primary hover:underline">
                          Apri
                        </Link>
                      )}
                      {item.type === "event" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-2 text-destructive hover:text-destructive"
                          disabled={pendingDelete === item.id}
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 />
                          Elimina evento
                        </Button>
                      )}
                    </PopoverContent>
                  </Popover>
                ))}
                {dayItems.length > 3 && (
                  <p className="px-1 text-[11px] text-muted-foreground">+{dayItems.length - 3} altri</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
