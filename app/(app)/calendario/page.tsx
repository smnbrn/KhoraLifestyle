import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/services/auth.service";
import { getCalendarItems } from "@/services/calendar.service";
import { listActiveClientsForSelect, listActiveProjectsForSelect } from "@/services/projects.service";
import { CALENDAR_STATUS, CALENDAR_TYPE_DOT, CALENDAR_TYPE_LABEL, CalendarGrid } from "./calendar-grid";
import { EventFormDialog } from "./event-form-dialog";

function monthHref(year: number, month: number) {
  return `/calendario?anno=${year}&mese=${month}`;
}

export default async function CalendarioPage({
  searchParams,
}: {
  searchParams: Promise<{ anno?: string; mese?: string }>;
}) {
  const params = await searchParams;
  const user = await getCurrentUser();

  const now = new Date();
  const year = Number(params.anno) || now.getFullYear();
  const month = Number(params.mese) || now.getMonth() + 1; // 1-12

  const monthDate = new Date(year, month - 1, 1);
  const prev = month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
  const next = month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };

  const [items, clients, projects] = await Promise.all([
    getCalendarItems(user!.id, year, month),
    listActiveClientsForSelect(user!.id),
    listActiveProjectsForSelect(user!.id),
  ]);

  return (
    <div className="space-y-6 px-4 py-6 md:px-6 md:py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Calendario</h1>
          <p className="text-sm text-muted-foreground">
            Tutte le scadenze — lavoro, vita e finanze — più i tuoi eventi.
          </p>
        </div>
        <EventFormDialog
          clients={clients}
          projects={projects}
          trigger={
            <Button>
              <Plus />
              Nuovo evento
            </Button>
          }
        />
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium capitalize">{format(monthDate, "MMMM yyyy", { locale: it })}</h2>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" asChild>
            <Link href={monthHref(prev.year, prev.month)}>
              <ChevronLeft />
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={monthHref(now.getFullYear(), now.getMonth() + 1)}>Oggi</Link>
          </Button>
          <Button variant="outline" size="icon" asChild>
            <Link href={monthHref(next.year, next.month)}>
              <ChevronRight />
            </Link>
          </Button>
        </div>
      </div>

      <CalendarGrid monthDate={monthDate} items={items} />

      <div className="space-y-2 text-xs text-muted-foreground">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          {(Object.keys(CALENDAR_STATUS) as (keyof typeof CALENDAR_STATUS)[]).map((status) => {
            const st = CALENDAR_STATUS[status];
            return (
              <span key={status} className={`flex items-center gap-1.5 rounded px-1.5 py-0.5 ${st.chip.split(" ")[0]}`}>
                <st.icon className={`size-3 ${st.text}`} /> <span className={st.text}>{st.label}</span>
              </span>
            );
          })}
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          {(Object.keys(CALENDAR_TYPE_DOT) as (keyof typeof CALENDAR_TYPE_DOT)[]).map((type) => (
            <span key={type} className="flex items-center gap-1.5">
              <span className={`size-1.5 rounded-full ${CALENDAR_TYPE_DOT[type]}`} /> {CALENDAR_TYPE_LABEL[type]}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
