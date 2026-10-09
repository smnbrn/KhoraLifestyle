import { z } from "zod";

import { timelineShape } from "@/schemas/timeline.schema";

export const taskSchema = z.object({
  title: z.string().min(1, "Il titolo è obbligatorio"),
  description: z.string().optional(),
  projectId: z.string().optional(),
  clientId: z.string().optional(),
  status: z.enum(["todo", "in_progress", "in_review", "completed"]),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  ...timelineShape,
  notes: z.string().optional(),
});

export type TaskInput = z.infer<typeof taskSchema>;
