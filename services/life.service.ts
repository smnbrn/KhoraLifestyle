import "server-only";

import { createClient } from "@/lib/supabase/server";
import { addDays, addMonths, dayNumber, diffDays, todayIso } from "@/lib/dates";
import { computeTimeline, toggleTimeline } from "@/lib/timeline";
import { RECURRENCE_MONTHS, RENT_FREQUENCY_MONTHS, type Recurrence } from "@/lib/constants/second-brain";
import type { Database } from "@/types/database.types";

type Tables = Database["public"]["Tables"];
export type RentalRow = Tables["rentals"]["Row"];
export type VehicleRow = Tables["vehicles"]["Row"];
export type DeadlineRow = Tables["life_deadlines"]["Row"];
export type TripRow = Tables["trips"]["Row"];
export type TripItemRow = Tables["trip_items"]["Row"];
export type WorkoutRow = Tables["workouts"]["Row"];

// =====================================================================
// AFFITTI
// =====================================================================
export function rentToMonthly(amount: number, frequency: string) {
  const months = RENT_FREQUENCY_MONTHS[frequency as keyof typeof RENT_FREQUENCY_MONTHS] ?? 1;
  return amount / months;
}

export async function listRentals(userId: string, showArchived = false) {
  const supabase = await createClient();
  let query = supabase.from("rentals").select("*").eq("user_id", userId);
  query = showArchived ? query.not("archived_at", "is", null) : query.is("archived_at", null);
  const { data } = await query.order("created_at", { ascending: true });
  return data ?? [];
}

export async function getRentalById(userId: string, id: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("rentals").select("*").eq("user_id", userId).eq("id", id).single();
  return data;
}

export async function createRental(values: Tables["rentals"]["Insert"]) {
  const supabase = await createClient();
  return supabase.from("rentals").insert(values).select().single();
}
export async function updateRental(userId: string, id: string, values: Tables["rentals"]["Update"]) {
  const supabase = await createClient();
  return supabase.from("rentals").update(values).eq("user_id", userId).eq("id", id).select().single();
}
export async function archiveRental(userId: string, id: string, archived: boolean) {
  const supabase = await createClient();
  return supabase.from("rentals").update({ archived_at: archived ? new Date().toISOString() : null }).eq("user_id", userId).eq("id", id);
}
export async function deleteRental(userId: string, id: string) {
  const supabase = await createClient();
  return supabase.from("rentals").delete().eq("user_id", userId).eq("id", id);
}

// =====================================================================
// VEICOLI
// =====================================================================
export async function listVehicles(userId: string, showArchived = false) {
  const supabase = await createClient();
  let query = supabase.from("vehicles").select("*").eq("user_id", userId);
  query = showArchived ? query.not("archived_at", "is", null) : query.is("archived_at", null);
  const { data } = await query.order("created_at", { ascending: true });
  return data ?? [];
}
export async function createVehicle(values: Tables["vehicles"]["Insert"]) {
  const supabase = await createClient();
  return supabase.from("vehicles").insert(values).select().single();
}
export async function updateVehicle(userId: string, id: string, values: Tables["vehicles"]["Update"]) {
  const supabase = await createClient();
  return supabase.from("vehicles").update(values).eq("user_id", userId).eq("id", id).select().single();
}
export async function archiveVehicle(userId: string, id: string, archived: boolean) {
  const supabase = await createClient();
  return supabase.from("vehicles").update({ archived_at: archived ? new Date().toISOString() : null }).eq("user_id", userId).eq("id", id);
}
export async function deleteVehicle(userId: string, id: string) {
  const supabase = await createClient();
  return supabase.from("vehicles").delete().eq("user_id", userId).eq("id", id);
}

// =====================================================================
// SCADENZE (affitti + veicoli)
// =====================================================================
export async function listDeadlines(
  userId: string,
  owner: { rentalId?: string; vehicleId?: string } = {},
  includeCompleted = false
) {
  const supabase = await createClient();
  let query = supabase.from("life_deadlines").select("*, rentals(name), vehicles(name)").eq("user_id", userId);
  if (!includeCompleted) query = query.is("completed_at", null);
  if (owner.rentalId) query = query.eq("rental_id", owner.rentalId);
  if (owner.vehicleId) query = query.eq("vehicle_id", owner.vehicleId);
  const { data } = await query.order("due_date", { ascending: true });
  return data ?? [];
}

export type DeadlineListItem = Awaited<ReturnType<typeof listDeadlines>>[number];

export async function createDeadline(values: Tables["life_deadlines"]["Insert"]) {
  const supabase = await createClient();
  return supabase.from("life_deadlines").insert(values).select().single();
}
export async function createDeadlines(values: Tables["life_deadlines"]["Insert"][]) {
  const supabase = await createClient();
  return supabase.from("life_deadlines").insert(values);
}
export async function updateDeadline(userId: string, id: string, values: Tables["life_deadlines"]["Update"]) {
  const supabase = await createClient();
  return supabase.from("life_deadlines").update(values).eq("user_id", userId).eq("id", id).select().single();
}
export async function deleteDeadline(userId: string, id: string) {
  const supabase = await createClient();
  return supabase.from("life_deadlines").delete().eq("user_id", userId).eq("id", id);
}

/** Prossima data di una scadenza ricorrente, sempre nel futuro rispetto a `today`. */
export function nextDueDate(due: string, recurrence: Recurrence, today: string): string | null {
  const step = RECURRENCE_MONTHS[recurrence];
  if (!step) return null;
  let next = due;
  let guard = 0;
  while (dayNumber(next) <= dayNumber(today) && guard < 600) {
    next = addMonths(due, step * (++guard));
  }
  return next;
}

/** Stato del tempo a giorni di una scadenza (serve a buildTimelineValues e all'interruttore). */
export async function getDeadlineTimelineState(userId: string, id: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("life_deadlines")
    .select("duration_days, timeline_running, frozen_since, frozen_days")
    .eq("user_id", userId)
    .eq("id", id)
    .maybeSingle();
  return data;
}

/** Sposta l'interruttore scorre/congelato di una scadenza e aggiorna la data di scadenza salvata. */
export async function setDeadlineRunning(userId: string, id: string, running: boolean) {
  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from("life_deadlines")
    .select("*")
    .eq("user_id", userId)
    .eq("id", id)
    .single();
  if (error || !row) return { error: error ?? new Error("Scadenza non trovata") };

  const today = todayIso();
  const next = toggleTimeline(row, running, today);
  const updated = { ...row, ...next };
  const end = computeTimeline({ ...updated, legacy_end: updated.due_date }, today).end;
  return supabase
    .from("life_deadlines")
    .update({ ...next, ...(row.start_date && row.duration_days != null && end ? { due_date: end } : {}) })
    .eq("user_id", userId)
    .eq("id", id);
}

/** Riapre una scadenza già chiusa (toglie la data di completamento). */
export async function reopenDeadline(userId: string, id: string) {
  const supabase = await createClient();
  return supabase.from("life_deadlines").update({ completed_at: null }).eq("user_id", userId).eq("id", id);
}

/**
 * "Pagato": una tantum si chiude, una ricorrente riparte.
 *   - a data fissa: slitta al prossimo periodo (mensile, trimestrale, annuale)
 *   - a giorni (inizio + durata): il nuovo ciclo parte dalla scadenza appena pagata e dura gli stessi giorni
 */
export async function markDeadlinePaid(userId: string, id: string) {
  const supabase = await createClient();
  const { data: deadline, error } = await supabase
    .from("life_deadlines")
    .select("*")
    .eq("user_id", userId)
    .eq("id", id)
    .single();
  if (error || !deadline) return { error: error ?? new Error("Scadenza non trovata") };

  const today = todayIso();

  if (deadline.recurrence !== "none" && deadline.start_date && deadline.duration_days != null) {
    const tl = computeTimeline({ ...deadline, legacy_end: deadline.due_date }, today);
    const newStart = tl.end && tl.end > today ? tl.end : today;
    return supabase
      .from("life_deadlines")
      .update({
        start_date: newStart,
        due_date: addDays(newStart, deadline.duration_days),
        frozen_days: 0,
        // se era congelata resta congelata: il blocco riparte da oggi
        frozen_since: deadline.timeline_running ? null : today,
        last_paid_at: today,
      })
      .eq("user_id", userId)
      .eq("id", id);
  }

  const next = nextDueDate(deadline.due_date, deadline.recurrence, today);
  const values: Tables["life_deadlines"]["Update"] = next
    ? { due_date: next, last_paid_at: today }
    : { completed_at: new Date().toISOString(), last_paid_at: today };
  return supabase.from("life_deadlines").update(values).eq("user_id", userId).eq("id", id);
}

// =====================================================================
// ALLENAMENTI
// =====================================================================
export async function listWorkoutsInRange(userId: string, start: string, end: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("workouts")
    .select("*")
    .eq("user_id", userId)
    .gte("workout_date", start)
    .lte("workout_date", end)
    .order("workout_date", { ascending: true });
  return data ?? [];
}

export async function toggleWorkout(userId: string, date: string, kind?: string | null) {
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("workouts")
    .select("id")
    .eq("user_id", userId)
    .eq("workout_date", date)
    .maybeSingle();
  if (existing) {
    const { error } = await supabase.from("workouts").delete().eq("user_id", userId).eq("id", existing.id);
    return { error, active: false };
  }
  const { error } = await supabase.from("workouts").insert({ user_id: userId, workout_date: date, kind: kind ?? null });
  return { error, active: true };
}

export async function updateWorkoutDetails(userId: string, date: string, kind: string | null, notes: string | null) {
  const supabase = await createClient();
  return supabase.from("workouts").update({ kind, notes }).eq("user_id", userId).eq("workout_date", date);
}

/** Statistiche allenamenti a partire dalle date dell'anno. */
export function workoutStats(dates: string[], today: string) {
  const set = new Set(dates);
  const year = today.slice(0, 4);
  const month = today.slice(0, 7);
  const inYear = dates.filter((d) => d.startsWith(year)).length;
  const inMonth = dates.filter((d) => d.startsWith(month)).length;
  const last7 = dates.filter((d) => {
    const delta = diffDays(today, d);
    return delta >= 0 && delta < 7;
  }).length;

  // Serie corrente: giorni consecutivi fino a oggi (se oggi non c'è ancora, si parte da ieri)
  let streak = 0;
  let cursor = set.has(today) ? dayNumber(today) : dayNumber(today) - 1;
  while (set.has(new Date(cursor * 86_400_000).toISOString().slice(0, 10))) {
    streak += 1;
    cursor -= 1;
  }
  return { inYear, inMonth, last7, streak };
}

// =====================================================================
// VIAGGI
// =====================================================================
export async function listTrips(userId: string) {
  const supabase = await createClient();
  const [{ data: trips }, { data: items }] = await Promise.all([
    supabase.from("trips").select("*").eq("user_id", userId).order("start_date", { ascending: true, nullsFirst: false }),
    supabase.from("trip_items").select("trip_id, cost, booked").eq("user_id", userId),
  ]);
  const agg = new Map<string, { cost: number; total: number; booked: number }>();
  for (const it of items ?? []) {
    const cur = agg.get(it.trip_id) ?? { cost: 0, total: 0, booked: 0 };
    cur.cost += Number(it.cost ?? 0);
    cur.total += 1;
    if (it.booked) cur.booked += 1;
    agg.set(it.trip_id, cur);
  }
  return (trips ?? []).map((t) => ({ ...t, ...(agg.get(t.id) ?? { cost: 0, total: 0, booked: 0 }) }));
}

export type TripListItem = Awaited<ReturnType<typeof listTrips>>[number];

export async function getTripById(userId: string, id: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("trips").select("*").eq("user_id", userId).eq("id", id).single();
  return data;
}

export async function listTripItems(userId: string, tripId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("trip_items")
    .select("*")
    .eq("user_id", userId)
    .eq("trip_id", tripId)
    .order("item_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });
  return data ?? [];
}

export async function createTrip(values: Tables["trips"]["Insert"]) {
  const supabase = await createClient();
  return supabase.from("trips").insert(values).select().single();
}
export async function updateTrip(userId: string, id: string, values: Tables["trips"]["Update"]) {
  const supabase = await createClient();
  return supabase.from("trips").update(values).eq("user_id", userId).eq("id", id).select().single();
}
export async function deleteTrip(userId: string, id: string) {
  const supabase = await createClient();
  return supabase.from("trips").delete().eq("user_id", userId).eq("id", id);
}
export async function createTripItem(values: Tables["trip_items"]["Insert"]) {
  const supabase = await createClient();
  return supabase.from("trip_items").insert(values).select().single();
}
export async function updateTripItem(userId: string, id: string, values: Tables["trip_items"]["Update"]) {
  const supabase = await createClient();
  return supabase.from("trip_items").update(values).eq("user_id", userId).eq("id", id);
}
export async function deleteTripItem(userId: string, id: string) {
  const supabase = await createClient();
  return supabase.from("trip_items").delete().eq("user_id", userId).eq("id", id);
}
