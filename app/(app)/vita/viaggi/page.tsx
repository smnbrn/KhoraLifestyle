import Link from "next/link";
import { MapPin, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { QuickForm } from "@/components/shared/quick-form";
import { TRIP_STATUS } from "@/lib/constants/second-brain";
import { diffDays, todayIso } from "@/lib/dates";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getCurrentUser } from "@/services/auth.service";
import { listTrips, type TripListItem } from "@/services/life.service";
import { saveTrip } from "../actions";
import { tripFields } from "./trip-forms";

function TripCard({ trip, today }: { trip: TripListItem; today: string }) {
  const until = trip.start_date ? diffDays(today, trip.start_date) : null;
  return (
    <Link href={`/vita/viaggi/${trip.id}`} className="block">
      <Card className="h-full transition-colors hover:border-primary/50">
        <CardContent className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <p className="font-medium">{trip.name}</p>
            <Badge variant="outline">{TRIP_STATUS[trip.status as keyof typeof TRIP_STATUS]}</Badge>
          </div>
          {trip.destination && (
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="size-3" /> {trip.destination}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            {trip.start_date ? formatDate(trip.start_date) : "Date da definire"}
            {trip.end_date ? ` → ${formatDate(trip.end_date)}` : ""}
            {until != null && until > 0 && trip.status !== "done" ? ` · tra ${until} giorni` : ""}
          </p>
          <p className="text-xs text-muted-foreground">
            {trip.total} voci · {trip.booked} prenotate · {formatCurrency(trip.cost)}
            {trip.budget != null ? ` su ${formatCurrency(Number(trip.budget))}` : ""}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}

export default async function ViaggiPage() {
  const user = await getCurrentUser();
  const trips = await listTrips(user!.id);
  const today = todayIso();
  const upcoming = trips.filter((t) => t.status !== "done");
  const done = trips.filter((t) => t.status === "done");

  return (
    <div className="space-y-8 px-4 py-6 md:px-6 md:py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Viaggi</h1>
          <p className="text-sm text-muted-foreground">Idee, prenotazioni e budget di ogni viaggio.</p>
        </div>
        <QuickForm
          title="Nuovo viaggio"
          fields={tripFields}
          action={saveTrip}
          submitLabel="Aggiungi"
          successMessage="Viaggio aggiunto"
          trigger={
            <Button>
              <Plus /> Viaggio
            </Button>
          }
        />
      </div>

      {trips.length === 0 && <p className="text-sm text-muted-foreground">Nessun viaggio: parti da un&apos;idea.</p>}

      {upcoming.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {upcoming.map((t) => (
            <TripCard key={t.id} trip={t} today={today} />
          ))}
        </div>
      )}

      {done.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">Fatti</h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {done.map((t) => (
              <TripCard key={t.id} trip={t} today={today} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
