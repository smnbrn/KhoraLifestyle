"use client";

import { useRef, useState } from "react";
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
import {
  AlertCircle,
  Check,
  CircleDashed,
  Clock,
  Trash2,
  Undo2,
} from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { deleteCalendarItem, setCalendarItemDone } from "./actions";
import type { CalendarItem, CalendarStatus } from "@/services/calendar.service";

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

/** Stato di una voce: colore, simbolo ed etichetta (usati nel calendario e nella legenda). */
export const CALENDAR_STATUS: Record<
  CalendarStatus,
  { label: string; chip: string; text: string; icon: typeof Check }
> = {
  done: {
    label: "Completato",
    chip: "bg-success/15 hover:bg-success/25",
    text: "text-success",
    icon: Check,
  },
  overdue: {
    label: "Scaduto",
    chip: "bg-destructive/10 hover:bg-destructive/20",
    text: "text-destructive",
    icon: AlertCircle,
  },
  progress: {
    label: "In corso",
    chip: "bg-orange-500/15 hover:bg-orange-500/25",
    text: "text-orange-600 dark:text-orange-400",
    icon: Clock,
  },
  upcoming: {
    label: "Da fare",
    chip: "hover:bg-accent",
    text: "text-muted-foreground",
    icon: CircleDashed,
  },
};

/** Pulsanti "Fatto" / "Elimina" / "Apri" di una voce: li usano sia il popup al passaggio del mouse sia la lista del giorno. */
function ItemActions({
  item,
  onDone,
}: {
  item: CalendarItem;
  onDone?: () => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function run(
    action: () => ReturnType<typeof deleteCalendarItem>,
    success: string,
  ) {
    setBusy(true);
    const result = await action();
    setBusy(false);
    if (result.success) {
      toast.success(success);
      router.refresh();
      onDone?.();
    } else {
      toast.error(result.error);
    }
  }

  const canOpen = item.href && item.type !== "event";
  if (!item.canComplete && !item.canDelete && !canOpen) return null;

  return (
    <div className="mt-2 flex flex-wrap items-center gap-1">
      {item.canComplete && (
        <Button
          variant={item.done ? "ghost" : "secondary"}
          size="sm"
          disabled={busy}
          onClick={() =>
            run(
              () => setCalendarItemDone(item.id, !item.done),
              item.done ? "Riaperto" : "Segnato come fatto",
            )
          }
        >
          {item.done ? <Undo2 /> : <Check />}
          {item.done ? "Riapri" : "Fatto"}
        </Button>
      )}
      {item.canDelete && (
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive"
          disabled={busy}
          onClick={() => {
            if (window.confirm(`Eliminare "${item.title}"?`))
              run(() => deleteCalendarItem(item.id), "Eliminato");
          }}
        >
          <Trash2 />
          Elimina
        </Button>
      )}
      {canOpen && (
        <Link
          href={item.href as string}
          className="px-2 text-xs text-primary hover:underline"
        >
          Apri
        </Link>
      )}
    </div>
  );
}

function ItemDetails({ item }: { item: CalendarItem }) {
  const st = CALENDAR_STATUS[item.status];
  return (
    <>
      <p className="text-xs text-muted-foreground">
        {TYPE_LABEL[item.type]} ·{" "}
        {format(new Date(item.date), "d MMMM yyyy", { locale: it })}
        {item.time ? ` · ${item.time.slice(0, 5)}` : ""}
      </p>
      <p
        className={cn(
          "mt-1 text-sm font-medium",
          item.done && "line-through opacity-70",
        )}
      >
        {item.title}
      </p>
      {item.subtitle && (
        <p className="text-xs text-muted-foreground">{item.subtitle}</p>
      )}
      <p
        className={cn(
          "mt-1 flex items-center gap-1 text-xs font-medium",
          st.text,
        )}
      >
        <st.icon className="size-3" /> {st.label}
      </p>
    </>
  );
}

/**
 * Una voce del giorno. Passando il mouse (o toccandola) si apre il riquadro con
 * "Fatto" / "Elimina"; resta aperto finché il mouse è sopra la voce o sopra il riquadro.
 */
function CalendarChip({
  item,
  open,
  onShow,
  onHideSoon,
  onClose,
}: {
  item: CalendarItem;
  open: boolean;
  onShow: () => void;
  onHideSoon: () => void;
  onClose: () => void;
}) {
  const st = CALENDAR_STATUS[item.status];
  const Icon = st.icon;
  const show = onShow;
  const hideSoon = onHideSoon;

  return (
    <Popover open={open} onOpenChange={(o) => (o ? onShow() : onClose())}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "flex w-full items-center gap-1 truncate rounded px-1 py-0.5 text-left text-[11px]",
            st.chip,
          )}
          onMouseEnter={show}
          onMouseLeave={hideSoon}
          onClick={(e) => {
            // il click non deve richiudere il riquadro già aperto al passaggio del mouse
            e.preventDefault();
            show();
          }}
        >
          <span
            className={cn(
              "size-1.5 shrink-0 rounded-full",
              TYPE_DOT[item.type],
            )}
          />
          <Icon className={cn("size-3 shrink-0", st.text)} />
          <span
            className={cn(
              "truncate",
              item.done && "line-through opacity-70",
              item.status === "overdue" && "text-destructive",
            )}
          >
            {item.title}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-64"
        side="right"
        align="start"
        sideOffset={6}
        onMouseEnter={show}
        onMouseLeave={hideSoon}
        onOpenAutoFocus={(e) => e.preventDefault()}
        // il riquadro si apre al passaggio del mouse: non deve rubare né restituire il fuoco,
        // altrimenti chiudendo il primo si chiuderebbe anche il secondo appena aperto
        onCloseAutoFocus={(e) => e.preventDefault()}
        onFocusOutside={(e) => e.preventDefault()}
      >
        <ItemDetails item={item} />
        <ItemActions item={item} onDone={onClose} />
      </PopoverContent>
    </Popover>
  );
}

/** "+N altri": elenco completo del giorno, con gli stessi pulsanti. */
function MoreItems({ items }: { items: CalendarItem[] }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="w-full rounded px-1 text-left text-[11px] text-muted-foreground hover:bg-accent">
          +{items.length} altri
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 space-y-3" side="right" align="start" sideOffset={6}>
        {items.map((item) => (
          <div
            key={item.id}
            className="border-b pb-3 last:border-b-0 last:pb-0"
          >
            <ItemDetails item={item} />
            <ItemActions item={item} />
          </div>
        ))}
      </PopoverContent>
    </Popover>
  );
}

export function CalendarGrid({
  monthDate,
  items,
  compact = false,
}: {
  monthDate: Date;
  items: CalendarItem[];
  compact?: boolean;
}) {
  // Un solo riquadro aperto alla volta, deciso qui: passando da una voce all'altra il nuovo
  // sostituisce subito il vecchio (niente chiusure "a tempo" che si pestano i piedi).
  const [openId, setOpenId] = useState<string | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showItem = (id: string) => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setOpenId(id);
  };
  const hideSoon = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setOpenId(null), 200);
  };

  const gridStart = startOfWeek(startOfMonth(monthDate), { weekStartsOn: 1 });
  const gridEnd = endOfWeek(endOfMonth(monthDate), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const itemsByDay = new Map<string, CalendarItem[]>();
  for (const item of items) {
    const list = itemsByDay.get(item.date) ?? [];
    list.push(item);
    itemsByDay.set(item.date, list);
  }

  const weekdayLabels = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        Passa il mouse su una voce per segnarla come «Fatto» o eliminarla.
      </p>
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
                  compact
                    ? "min-h-20 border-r border-b p-1 last:border-r-0"
                    : "min-h-24 border-r border-b p-1.5 last:border-r-0",
                  !inMonth && "bg-muted/20 text-muted-foreground",
                )}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      "flex size-6 items-center justify-center rounded-full text-xs",
                      isToday(day) &&
                        "bg-primary font-medium text-primary-foreground",
                    )}
                  >
                    {format(day, "d")}
                  </span>
                </div>
                <div className="mt-1 space-y-0.5">
                  {dayItems.slice(0, 3).map((item) => (
                    <CalendarChip
                      key={item.id}
                      item={item}
                      open={openId === item.id}
                      onShow={() => showItem(item.id)}
                      onHideSoon={hideSoon}
                      onClose={() => setOpenId(null)}
                    />
                  ))}
                  {dayItems.length > 3 && (
                    <MoreItems items={dayItems.slice(3)} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
