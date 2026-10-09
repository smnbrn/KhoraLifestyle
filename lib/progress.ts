import { computeTimeline } from "@/lib/timeline";

type PhaseLike = {
  completed: boolean;
  duration_days: number;
  /** se valorizzata è una micro attività: non pesa sul progresso del progetto (conta la sua macro) */
  parent_id?: string | null;
};

export type ProjectProgress = {
  percent: number;
  label: string;
  basedOn: "phases" | "tasks" | "none";
  /** true se ci sono macro attività e sono tutte completate: il progetto è di fatto finito */
  allDone: boolean;
};

/**
 * Progresso reale del progetto (0-100).
 * - Con macro attività: pesate per durata (una fase da 20 giorni pesa più di una da 2).
 *   Le micro attività (parent_id) non contano: il peso è della macro che le contiene.
 * - Senza: percentuale di task completati.
 */
export function projectProgress(allPhases: PhaseLike[], tasks: { status: string }[]): ProjectProgress {
  const phases = allPhases.filter((p) => !p.parent_id);
  if (phases.length > 0) {
    const total = phases.reduce((s, p) => s + p.duration_days, 0);
    const done = phases.filter((p) => p.completed).reduce((s, p) => s + p.duration_days, 0);
    const count = phases.filter((p) => p.completed).length;
    return {
      percent: total > 0 ? Math.round((done / total) * 100) : 0,
      label: `${count} di ${phases.length} macro attività completate`,
      basedOn: "phases",
      allDone: count === phases.length,
    };
  }
  if (tasks.length > 0) {
    const count = tasks.filter((t) => t.status === "completed").length;
    return {
      percent: Math.round((count / tasks.length) * 100),
      label: `${count} di ${tasks.length} task completati`,
      basedOn: "tasks",
      allDone: false,
    };
  }
  return { percent: 0, label: "Nessuna macro attività o task", basedOn: "none", allDone: false };
}

/** Un progetto è chiuso se lo dice lo stato, oppure se tutte le sue macro attività sono completate. */
export function isProjectClosed(status: string, progress?: { allDone: boolean } | null): boolean {
  return status === "completed" || status === "cancelled" || !!progress?.allDone;
}

export { computeTimeline };
