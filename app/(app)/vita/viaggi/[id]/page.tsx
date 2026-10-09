import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Pencil, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeleteButton, QuickForm } from "@/components/shared/quick-form";
import { TRIP_ITEM_KIND, TRIP_STATUS } from "@/lib/constants/second-brain";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { getCurrentUser } from "@/services/auth.service";
import { getTripById, listTripItems } from "@/services/life.service";
import { removeTrip, removeTripItem, saveTrip, saveTripItem, setTripItemBooked } from "../../actions";
import { tripFields, tripItemFields } from "../trip-forms";
import { ActionButton } from "@/components/shared/quick-form";

export default async function TripPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  const userId = user!.id;

  const [trip, items] = await Promise.all([getTripById(userId, id), listTripItems(userId, id)]);
  if (!trip) notFound();

  const totalCost = items.reduce((s, i) => s + Number(i.cost ?? 0), 0);
  const bookedCost = items.filter((i) => i.booked).reduce((s, i) => s + Number(i.cost ?? 0), 0);
  const budget = trip.budget != null ? Number(trip.budget) : null;
  const overBudget = budget != null && totalCost > budget;

  async function afterDelete() {
    "use server";
    const r = await removeTrip(id);
    if (r.success) redirect("/vita/viaggi");
    return r;
  }

  return (
    <div className="space-y-6 px-4 py-6 md:px-6 md:py-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <Link href="/vita/viaggi" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-3" /> Viaggi
          </Link>
          <h1 className="text-2xl font-semibold text-foreground">{trip.name}</h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="outline">{TRIP_STATUS[trip.status as keyof typeof TRIP_STATUS]}</Badge>
            {trip.destination && <span>{trip.destination}</span>}
            {trip.start_date && (
              <span>
                {formatDate(trip.start_date)}
                {trip.end_date ? ` → ${formatDate(trip.end_date)}` : ""}
              </span>
            )}
          </div>
          {trip.notes && <p className="max-w-prose pt-1 text-sm text-muted-foreground">{trip.notes}</p>}
        </div>
        <div className="flex items-center">
          <QuickForm
            title="Modifica viaggio"
            fields={tripFields}
            values={{
              name: trip.name,
              destination: trip.destination,
              status: trip.status,
              start_date: trip.start_date,
              end_date: trip.end_date,
              budget: trip.budget,
              notes: trip.notes,
            }}
            hidden={{ id: trip.id }}
            action={saveTrip}
            successMessage="Viaggio aggiornato"
            trigger={
              <Button variant="outline" size="sm">
                <Pencil /> Modifica
              </Button>
            }
          />
          <DeleteButton action={afterDelete} what={`il viaggio «${trip.name}»`} />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="space-y-1">
            <p className="text-xs text-muted-foreground">Budget</p>
            <p className="tabular text-xl font-semibold">{budget != null ? formatCurrency(budget) : "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-1">
            <p className="text-xs text-muted-foreground">Previsto</p>
            <p className={cn("tabular text-xl font-semibold", overBudget && "text-destructive")}>{formatCurrency(totalCost)}</p>
            {budget != null && (
              <p className="text-xs text-muted-foreground">
                {overBudget ? `${formatCurrency(totalCost - budget)} oltre il budget` : `${formatCurrency(budget - totalCost)} ancora liberi`}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-1">
            <p className="text-xs text-muted-foreground">Già prenotato</p>
            <p className="tabular text-xl font-semibold">{formatCurrency(bookedCost)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">Programma e prenotazioni</CardTitle>
          <QuickForm
            title="Nuova voce"
            fields={tripItemFields}
            hidden={{ trip_id: trip.id }}
            action={saveTripItem}
            successMessage="Voce aggiunta"
            trigger={
              <Button variant="ghost" size="sm">
                <Plus /> Voce
              </Button>
            }
          />
        </CardHeader>
        <CardContent className="space-y-3">
          {items.length === 0 && <p className="text-sm text-muted-foreground">Aggiungi voli, alloggi, attività o cose da fare.</p>}
          {items.map((it) => (
            <div key={it.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              <Badge variant="outline">{TRIP_ITEM_KIND[it.kind as keyof typeof TRIP_ITEM_KIND]}</Badge>
              <span className={cn("min-w-0 flex-1 truncate", it.booked && "text-muted-foreground")}>{it.title}</span>
              {it.item_date && <span className="text-xs text-muted-foreground">{formatDate(it.item_date)}</span>}
              {it.cost != null && <span className="tabular text-muted-foreground">{formatCurrency(Number(it.cost))}</span>}
              <ActionButton action={setTripItemBooked.bind(null, it.id, !it.booked)} variant={it.booked ? "secondary" : "outline"}>
                {it.booked ? "Prenotato ✓" : "Da prenotare"}
              </ActionButton>
              <QuickForm
                title="Modifica voce"
                fields={tripItemFields}
                values={{ title: it.title, kind: it.kind, item_date: it.item_date, cost: it.cost, booked: it.booked ? "yes" : "no" }}
                hidden={{ id: it.id }}
                action={saveTripItem}
                successMessage="Voce aggiornata"
                trigger={
                  <Button variant="ghost" size="icon" aria-label="Modifica voce">
                    <Pencil />
                  </Button>
                }
              />
              <DeleteButton action={removeTripItem.bind(null, it.id)} what="questa voce" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
