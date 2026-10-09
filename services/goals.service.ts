import "server-only";

import { createClient } from "@/lib/supabase/server";
import { GOAL_SOURCE_META, type GoalSource } from "@/lib/constants/second-brain";
import { overlapDays, todayIso } from "@/lib/dates";
import type { Database } from "@/types/database.types";

type GoalInsert = Database["public"]["Tables"]["goals"]["Insert"];
type GoalUpdate = Database["public"]["Tables"]["goals"]["Update"];
export type GoalRow = Database["public"]["Tables"]["goals"]["Row"];

export type GoalProgress = GoalRow & {
  current: number;
  remaining: number;
  /** 0-1 (limitato a 1 nell'anello) */
  ratio: number;
  reached: boolean;
  format: "currency" | "number";
  suffix?: string;
};

// ---- calcolo dei valori automatici (un solo posto) ----
async function computeAutoValues(userId: string, year: number, sources: Set<GoalSource>) {
  const supabase = await createClient();
  const start = `${year}-01-01`;
  const end = `${year}-12-31`;
  const today = todayIso();
  const values: Partial<Record<GoalSource, number>> = {};

  const jobs: Promise<void>[] = [];

  if (sources.has("income_year")) {
    jobs.push(
      (async () => {
        const { data } = await supabase
          .from("transactions")
          .select("amount")
          .eq("user_id", userId)
          .eq("type", "income")
          .gte("transaction_date", start)
          .lte("transaction_date", end);
        values.income_year = (data ?? []).reduce((s, t) => s + Number(t.amount), 0);
      })()
    );
  }

  if (sources.has("invested_year")) {
    jobs.push(
      (async () => {
        const { data } = await supabase
          .from("investment_movements")
          .select("kind, amount")
          .eq("user_id", userId)
          .gte("movement_date", start)
          .lte("movement_date", end);
        values.invested_year = (data ?? []).reduce(
          (s, m) => s + (m.kind === "deposit" ? Number(m.amount) : -Number(m.amount)),
          0
        );
      })()
    );
  }

  if (sources.has("gym_days")) {
    jobs.push(
      (async () => {
        const { count } = await supabase
          .from("workouts")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .gte("workout_date", start)
          .lte("workout_date", end);
        values.gym_days = count ?? 0;
      })()
    );
  }

  if (sources.has("clients_acquired")) {
    jobs.push(
      (async () => {
        const { count } = await supabase
          .from("clients")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .gte("created_at", `${start}T00:00:00`)
          .lte("created_at", `${end}T23:59:59`);
        values.clients_acquired = count ?? 0;
      })()
    );
  }

  if (sources.has("travel_days")) {
    jobs.push(
      (async () => {
        // Giorni di viaggio già "vissuti": viaggi prenotati/fatti, contati fino a oggi.
        const { data } = await supabase
          .from("trips")
          .select("start_date, end_date, status")
          .eq("user_id", userId)
          .in("status", ["booked", "done"])
          .not("start_date", "is", null)
          .not("end_date", "is", null);
        let days = 0;
        for (const t of data ?? []) {
          const tripEnd = (t.end_date as string) < today ? (t.end_date as string) : today;
          if ((t.start_date as string) > today) continue;
          days += overlapDays(t.start_date as string, tripEnd, start, end);
        }
        values.travel_days = days;
      })()
    );
  }

  await Promise.all(jobs);
  return values;
}

export async function listGoals(userId: string, year: number, options: { category?: string; homeOnly?: boolean } = {}) {
  const supabase = await createClient();
  let query = supabase.from("goals").select("*").eq("user_id", userId).eq("year", year);
  if (options.category) query = query.eq("category", options.category as GoalRow["category"]);
  if (options.homeOnly) query = query.eq("show_on_home", true);
  const { data } = await query.order("sort_order", { ascending: true }).order("created_at", { ascending: true });
  return data ?? [];
}

export async function getGoalsProgress(
  userId: string,
  year: number,
  options: { category?: string; homeOnly?: boolean } = {}
): Promise<GoalProgress[]> {
  const goals = await listGoals(userId, year, options);
  if (goals.length === 0) return [];

  const autoSources = new Set(goals.filter((g) => g.source !== "manual").map((g) => g.source as GoalSource));
  const auto = autoSources.size > 0 ? await computeAutoValues(userId, year, autoSources) : {};

  return goals.map((g) => {
    const meta = GOAL_SOURCE_META[g.source as GoalSource];
    const current = g.source === "manual" ? Number(g.manual_value) : (auto[g.source as GoalSource] ?? 0);
    const target = Number(g.target);
    return {
      ...g,
      current,
      remaining: Math.max(0, target - current),
      ratio: target > 0 ? Math.min(1, Math.max(0, current / target)) : 0,
      reached: current >= target,
      format: meta.format,
      suffix: meta.suffix,
    };
  });
}

export async function createGoal(values: GoalInsert) {
  const supabase = await createClient();
  return supabase.from("goals").insert(values).select().single();
}

export async function updateGoal(userId: string, id: string, values: GoalUpdate) {
  const supabase = await createClient();
  return supabase.from("goals").update(values).eq("user_id", userId).eq("id", id).select().single();
}

export async function deleteGoal(userId: string, id: string) {
  const supabase = await createClient();
  return supabase.from("goals").delete().eq("user_id", userId).eq("id", id);
}
