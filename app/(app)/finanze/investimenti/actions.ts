"use server";

import { revalidatePath } from "next/cache";

import type { ActionResult } from "@/lib/action-result";
import { INVESTMENT_KIND, MOVEMENT_KIND } from "@/lib/constants/second-brain";
import { todayIso } from "@/lib/dates";
import { num, oneOf, str } from "@/lib/form-data";
import { getCurrentUser } from "@/services/auth.service";
import {
  createInvestment,
  createMovement,
  deleteInvestment,
  deleteMovement,
  updateInvestment,
} from "@/services/investments.service";

const KINDS = Object.keys(INVESTMENT_KIND) as (keyof typeof INVESTMENT_KIND)[];
const MOVEMENTS = Object.keys(MOVEMENT_KIND) as (keyof typeof MOVEMENT_KIND)[];
const NO_USER: ActionResult<never> = { success: false, error: "Sessione scaduta. Accedi di nuovo." };

function refresh() {
  for (const p of ["/finanze/investimenti", "/finanze", "/dashboard"]) revalidatePath(p);
}

export async function saveInvestment(fd: FormData): Promise<ActionResult<{ id: string }>> {
  const user = await getCurrentUser();
  if (!user) return NO_USER;
  const name = str(fd, "name");
  if (!name) return { success: false, error: "Serve un nome." };

  const values = {
    name,
    kind: oneOf(fd, "kind", KINDS, "other"),
    current_value: num(fd, "current_value"),
    notes: str(fd, "notes"),
  };
  const id = str(fd, "id");
  const { data, error } = id
    ? await updateInvestment(user.id, id, values)
    : await createInvestment({ ...values, user_id: user.id });
  if (error || !data) return { success: false, error: "Salvataggio non riuscito. Riprova." };
  refresh();
  return { success: true, data: { id: data.id } };
}

export async function removeInvestment(id: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return NO_USER;
  const { error } = await deleteInvestment(user.id, id);
  if (error) return { success: false, error: "Eliminazione non riuscita." };
  refresh();
  return { success: true, data: undefined };
}

export async function addMovement(fd: FormData): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return NO_USER;
  const investmentId = str(fd, "investment_id");
  const amount = num(fd, "amount");
  if (!investmentId) return { success: false, error: "Investimento mancante." };
  if (amount == null || amount <= 0) return { success: false, error: "Importo non valido." };

  const { error } = await createMovement({
    user_id: user.id,
    investment_id: investmentId,
    kind: oneOf(fd, "kind", MOVEMENTS, "deposit"),
    amount,
    movement_date: str(fd, "movement_date") ?? todayIso(),
    notes: str(fd, "notes"),
  });
  if (error) return { success: false, error: "Salvataggio non riuscito. Riprova." };
  refresh();
  return { success: true, data: undefined };
}

export async function removeMovement(id: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return NO_USER;
  const { error } = await deleteMovement(user.id, id);
  if (error) return { success: false, error: "Eliminazione non riuscita." };
  refresh();
  return { success: true, data: undefined };
}
