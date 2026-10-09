import { computeTimeline } from "@/lib/timeline";

type PhaseLike = {
  completed: boolean;
  duration_days: number;
};

/**
 * Progresso reale del progetto (0-100).
 * - Con macro attività: pesate per durata (una fase da 20 giorni pesa più di una da 2).
 * - Senza: percentuale di task completati.
 */
export function projectProgress(
  phases: PhaseLike[],
  tasks: { status: string }[]
): { percent: number; label: string; basedOn: "phases" | "tasks" | "none" } {
  if (phases.length > 0) {
    const total = phases.reduce((s, p) => s + p.duration_days, 0);
    const done = phases.filter((p) => p.completed).reduce((s, p) => s + p.duration_days, 0);
    const count = phases.filter((p) => p.completed).length;
    return {
      percent: total > 0 ? Math.round((done / total) * 100) : 0,
      label: `${count} di ${phases.length} macro attività completate`,
      basedOn: "phases",
    };
  }
  if (tasks.length > 0) {
    const count = tasks.filter((t) => t.status === "completed").length;
    return {
      percent: Math.round((count / tasks.length) * 100),
      label: `${count} di ${tasks.length} task completati`,
      basedOn: "tasks",
    };
  }
  return { percent: 0, label: "Nessuna macro attività o task", basedOn: "none" };
}

export { computeTimeline };
