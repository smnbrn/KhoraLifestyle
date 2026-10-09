"use server";

import { revalidatePath } from "next/cache";

import type { ActionResult } from "@/lib/action-result";
import {
  DEADLINE_KIND,
  RECURRENCE,
  RENT_FREQUENCY,
  TRIP_ITEM_KIND,
  TRIP_STATUS,
  VEHICLE_KIND,
} from "@/lib/constants/second-brain";
import { todayIso } from "@/lib/dates";
import { num, oneOf, str } from "@/lib/form-data";
import { getCurrentUser } from "@/services/auth.service";
import {
  archiveRental,
  archiveVehicle,
  createDeadline,
  createRental,
  createTrip,
  createTripItem,
  createVehicle,
  deleteDeadline,
  deleteRental,
  deleteTrip,
  deleteTripItem,
  deleteVehicle,
  markDeadlinePaid,
  toggleWorkout,
  updateDeadline,
  updateRental,
  updateTrip,
  updateTripItem,
  updateVehicle,
  updateWorkoutDetails,
} from "@/services/life.service";

const NO_USER: ActionResult<never> = { success: false, error: "Sessione scaduta. Accedi di nuovo." };
const FAIL = { success: false, error: "Operazione non riuscita. Riprova." } as const;
const OK: ActionResult = { success: true, data: undefined };

function refresh() {
  for (const p of ["/vita", "/vita/affitti", "/vita/veicoli", "/vita/viaggi", "/vita/allenamenti", "/calendario", "/dashboard"]) {
    revalidatePath(p);
  }
}

// ---------------- Affitti ----------------
export async function saveRental(fd: FormData): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return NO_USER;
  const name = str(fd, "name");
  if (!name) return { success: false, error: "Serve un nome (es. Casa 1)." };
  const values = {
    name,
    address: str(fd, "address"),
    tenant_name: str(fd, "tenant_name"),
    rent_amount: num(fd, "rent_amount") ?? 0,
    rent_frequency: oneOf(fd, "rent_frequency", Object.keys(RENT_FREQUENCY) as (keyof typeof RENT_FREQUENCY)[], "monthly"),
    contract_start: str(fd, "contract_start"),
    contract_end: str(fd, "contract_end"),
    imu_amount: num(fd, "imu_amount"),
    notes: str(fd, "notes"),
  };
  const id = str(fd, "id");
  const { error } = id ? await updateRental(user.id, id, values) : await createRental({ ...values, user_id: user.id });
  if (error) return FAIL;
  refresh();
  return OK;
}

export async function removeRental(id: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return NO_USER;
  const { error } = await deleteRental(user.id, id);
  if (error) return FAIL;
  refresh();
  return OK;
}

export async function setRentalArchived(id: string, archived: boolean): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return NO_USER;
  const { error } = await archiveRental(user.id, id, archived);
  if (error) return FAIL;
  refresh();
  return OK;
}

// ---------------- Veicoli ----------------
export async function saveVehicle(fd: FormData): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return NO_USER;
  const name = str(fd, "name");
  if (!name) return { success: false, error: "Serve un nome (es. Panda)." };
  const values = {
    name,
    plate: str(fd, "plate"),
    kind: oneOf(fd, "kind", Object.keys(VEHICLE_KIND) as (keyof typeof VEHICLE_KIND)[], "car"),
    notes: str(fd, "notes"),
  };
  const id = str(fd, "id");
  const { error } = id ? await updateVehicle(user.id, id, values) : await createVehicle({ ...values, user_id: user.id });
  if (error) return FAIL;
  refresh();
  return OK;
}

export async function removeVehicle(id: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return NO_USER;
  const { error } = await deleteVehicle(user.id, id);
  if (error) return FAIL;
  refresh();
  return OK;
}

export async function setVehicleArchived(id: string, archived: boolean): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return NO_USER;
  const { error } = await archiveVehicle(user.id, id, archived);
  if (error) return FAIL;
  refresh();
  return OK;
}

// ---------------- Scadenze (affitti + veicoli) ----------------
export async function saveDeadline(fd: FormData): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return NO_USER;
  const kind = oneOf(fd, "kind", Object.keys(DEADLINE_KIND) as (keyof typeof DEADLINE_KIND)[], "other");
  const dueDate = str(fd, "due_date");
  if (!dueDate) return { success: false, error: "Indica la data di scadenza." };
  const rentalId = str(fd, "rental_id");
  const vehicleId = str(fd, "vehicle_id");
  if (!!rentalId === !!vehicleId) return { success: false, error: "Scadenza non collegata correttamente." };

  const values = {
    kind,
    title: str(fd, "title") ?? DEADLINE_KIND[kind],
    due_date: dueDate,
    amount: num(fd, "amount"),
    recurrence: oneOf(fd, "recurrence", Object.keys(RECURRENCE) as (keyof typeof RECURRENCE)[], "none"),
    notes: str(fd, "notes"),
  };
  const id = str(fd, "id");
  const { error } = id
    ? await updateDeadline(user.id, id, values)
    : await createDeadline({ ...values, user_id: user.id, rental_id: rentalId, vehicle_id: vehicleId });
  if (error) return FAIL;
  refresh();
  return OK;
}

export async function payDeadline(id: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return NO_USER;
  const { error } = await markDeadlinePaid(user.id, id);
  if (error) return FAIL;
  refresh();
  return OK;
}

export async function removeDeadline(id: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return NO_USER;
  const { error } = await deleteDeadline(user.id, id);
  if (error) return FAIL;
  refresh();
  return OK;
}

// ---------------- Allenamenti ----------------
export async function toggleWorkoutDay(date: string): Promise<ActionResult<{ active: boolean }>> {
  const user = await getCurrentUser();
  if (!user) return NO_USER;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return FAIL;
  const { error, active } = await toggleWorkout(user.id, date);
  if (error) return FAIL;
  refresh();
  return { success: true, data: { active } };
}

export async function saveWorkoutDetails(fd: FormData): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return NO_USER;
  const date = str(fd, "workout_date") ?? todayIso();
  const { error } = await updateWorkoutDetails(user.id, date, str(fd, "kind"), str(fd, "notes"));
  if (error) return FAIL;
  refresh();
  return OK;
}

// ---------------- Viaggi ----------------
export async function saveTrip(fd: FormData): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return NO_USER;
  const name = str(fd, "name");
  if (!name) return { success: false, error: "Dai un nome al viaggio." };
  const start = str(fd, "start_date");
  const end = str(fd, "end_date");
  if (start && end && end < start) return { success: false, error: "Il ritorno è prima della partenza." };
  const values = {
    name,
    destination: str(fd, "destination"),
    start_date: start,
    end_date: end,
    status: oneOf(fd, "status", Object.keys(TRIP_STATUS) as (keyof typeof TRIP_STATUS)[], "idea"),
    budget: num(fd, "budget"),
    notes: str(fd, "notes"),
  };
  const id = str(fd, "id");
  const { error } = id ? await updateTrip(user.id, id, values) : await createTrip({ ...values, user_id: user.id });
  if (error) return FAIL;
  refresh();
  return OK;
}

export async function removeTrip(id: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return NO_USER;
  const { error } = await deleteTrip(user.id, id);
  if (error) return FAIL;
  refresh();
  return OK;
}

export async function saveTripItem(fd: FormData): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return NO_USER;
  const title = str(fd, "title");
  if (!title) return { success: false, error: "Scrivi cosa c'è da fare o prenotare." };
  const values = {
    title,
    kind: oneOf(fd, "kind", Object.keys(TRIP_ITEM_KIND) as (keyof typeof TRIP_ITEM_KIND)[], "todo"),
    item_date: str(fd, "item_date"),
    cost: num(fd, "cost"),
    booked: fd.get("booked") === "yes",
  };
  const id = str(fd, "id");
  const tripId = str(fd, "trip_id");
  if (!id && !tripId) return FAIL;
  const { error } = id
    ? await updateTripItem(user.id, id, values)
    : await createTripItem({ ...values, user_id: user.id, trip_id: tripId! });
  if (error) return FAIL;
  refresh();
  return OK;
}

export async function setTripItemBooked(id: string, booked: boolean): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return NO_USER;
  const { error } = await updateTripItem(user.id, id, { booked });
  if (error) return FAIL;
  refresh();
  return OK;
}

export async function removeTripItem(id: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return NO_USER;
  const { error } = await deleteTripItem(user.id, id);
  if (error) return FAIL;
  refresh();
  return OK;
}
