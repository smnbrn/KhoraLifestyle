import { z } from "zod";

import { timelineShape } from "@/schemas/timeline.schema";

export const customFieldSchema = z.object({
  label: z.string().min(1, "Il nome del campo è obbligatorio"),
  value: z.string().optional(),
});

export const projectSchema = z.object({
  clientId: z.string().min(1, "Seleziona un cliente"),
  name: z.string().min(1, "Il nome è obbligatorio"),
  description: z.string().optional(),
  status: z.enum(["planned", "in_progress", "paused", "completed", "cancelled"]),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  ...timelineShape,
  actualEndDate: z.string().optional(),
  budget: z.string().optional(),
  projectValue: z.string().optional(),
  notes: z.string().optional(),
  customFields: z.array(customFieldSchema).optional(),
});

export type CustomFieldInput = z.infer<typeof customFieldSchema>;
export type ProjectInput = z.infer<typeof projectSchema>;

export function customFieldsToArray(value: unknown): CustomFieldInput[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  return Object.entries(value as Record<string, unknown>).map(([label, v]) => ({
    label,
    value: typeof v === "string" ? v : String(v ?? ""),
  }));
}
