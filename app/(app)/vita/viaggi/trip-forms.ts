import type { QuickField } from "@/components/shared/quick-form";
import { TRIP_ITEM_KIND, TRIP_STATUS } from "@/lib/constants/second-brain";

export const tripFields: QuickField[] = [
  { name: "name", label: "Nome", required: true, placeholder: "es. Estate in Grecia" },
  { name: "destination", label: "Destinazione", width: "half" },
  {
    name: "status",
    label: "Stato",
    type: "select",
    width: "half",
    options: Object.entries(TRIP_STATUS).map(([value, label]) => ({ value, label })),
  },
  { name: "start_date", label: "Partenza", type: "date", width: "half" },
  { name: "end_date", label: "Ritorno", type: "date", width: "half" },
  { name: "budget", label: "Budget (€)", type: "number", width: "half" },
  { name: "notes", label: "Note", type: "textarea" },
];

export const tripItemFields: QuickField[] = [
  { name: "title", label: "Cosa", required: true, placeholder: "es. Volo Milano–Atene" },
  {
    name: "kind",
    label: "Tipo",
    type: "select",
    width: "half",
    options: Object.entries(TRIP_ITEM_KIND).map(([value, label]) => ({ value, label })),
  },
  { name: "item_date", label: "Data", type: "date", width: "half" },
  { name: "cost", label: "Costo (€)", type: "number", width: "half" },
  {
    name: "booked",
    label: "Prenotato",
    type: "select",
    width: "half",
    options: [
      { value: "no", label: "No" },
      { value: "yes", label: "Sì" },
    ],
  },
];
