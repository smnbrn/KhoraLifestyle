import { Pencil, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeleteButton, QuickForm, type QuickField } from "@/components/shared/quick-form";
import { VEHICLE_KIND } from "@/lib/constants/second-brain";
import { getCurrentUser } from "@/services/auth.service";
import { listDeadlines, listVehicles } from "@/services/life.service";
import { removeVehicle, saveVehicle } from "../actions";
import { AddDeadlineButton, DeadlineList } from "../deadline-list";

const KINDS = ["insurance", "bollo", "service", "inspection", "other"] as const;

const vehicleFields: QuickField[] = [
  { name: "name", label: "Nome", required: true, placeholder: "es. Panda" },
  {
    name: "kind",
    label: "Tipo",
    type: "select",
    width: "half",
    options: Object.entries(VEHICLE_KIND).map(([value, label]) => ({ value, label })),
  },
  { name: "plate", label: "Targa", width: "half" },
  { name: "notes", label: "Note", type: "textarea" },
];

export default async function VeicoliPage() {
  const user = await getCurrentUser();
  const userId = user!.id;
  const [vehicles, deadlines] = await Promise.all([listVehicles(userId), listDeadlines(userId)]);

  return (
    <div className="space-y-6 px-4 py-6 md:px-6 md:py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Veicoli</h1>
          <p className="text-sm text-muted-foreground">Assicurazione, bollo, tagliando e revisione sempre sotto controllo.</p>
        </div>
        <QuickForm
          title="Nuovo veicolo"
          fields={vehicleFields}
          action={saveVehicle}
          submitLabel="Aggiungi"
          successMessage="Veicolo aggiunto"
          trigger={
            <Button>
              <Plus /> Veicolo
            </Button>
          }
        />
      </div>

      {vehicles.length === 0 && <p className="text-sm text-muted-foreground">Nessun veicolo.</p>}

      <div className="grid gap-4 lg:grid-cols-2">
        {vehicles.map((v) => (
          <Card key={v.id}>
            <CardHeader className="flex-row items-start justify-between gap-3">
              <div className="space-y-1">
                <CardTitle className="text-base">{v.name}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{VEHICLE_KIND[v.kind as keyof typeof VEHICLE_KIND]}</Badge>
                  {v.plate && <span className="text-xs uppercase text-muted-foreground">{v.plate}</span>}
                </div>
              </div>
              <div className="flex items-center">
                <QuickForm
                  title="Modifica veicolo"
                  fields={vehicleFields}
                  values={{ name: v.name, kind: v.kind, plate: v.plate, notes: v.notes }}
                  hidden={{ id: v.id }}
                  action={saveVehicle}
                  successMessage="Veicolo aggiornato"
                  trigger={
                    <Button variant="ghost" size="icon" aria-label="Modifica">
                      <Pencil />
                    </Button>
                  }
                />
                <DeleteButton action={removeVehicle.bind(null, v.id)} what={`«${v.name}»`} />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">Scadenze</p>
                <AddDeadlineButton owner={{ vehicle_id: v.id }} kinds={[...KINDS]} />
              </div>
              <DeadlineList deadlines={deadlines.filter((d) => d.vehicle_id === v.id)} kinds={[...KINDS]} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
