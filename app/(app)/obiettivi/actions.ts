"use server";

import { revalidatePath } from "next/cache";

import type { ActionResult } from "@/lib/action-result";
import { GOAL_CATEGORY, GOAL_SOURCE, GOAL_SOURCE_META } from "@/lib/constants/second-brain";
import { currentYear } from "@/lib/dates";
import { num, oneOf, str } from "@/lib/form-data";
import { getCurrentUser } from "@/services/auth.service";
import { createGoal, deleteGoal, updateGoal } from "@/services/goals.service";

const CATEGORIES = Object.keys(GOAL_CATEGORY) as (keyof typeof GOAL_CATEGORY)[];
const SOURCES = Object.keys(GOAL_SOURCE) as (keyof typeof GOAL_SOURCE)[];

function refresh() {
  for (const p of ["/dashboard", "/lavoro", "/finanze", "/vita"]) revalidatePath(p);
}

export async function saveGoal(fd: FormData): Promise<ActionResult<{ id: string }>> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Sessione scaduta. Accedi di nuovo." };

  const source = oneOf(fd, "source", SOURCES, "manual");
  const title = str(fd, "title") ?? GOAL_SOURCE_META[source].title;
  const target = num(fd, "target");
  if (!title) return { success: false, error: "Dai un nome all'obiettivo." };
  if (target == null || target <= 0) return { success: false, error: "L'obiettivo deve essere maggiore di zero." };

  const year = Math.round(num(fd, "year") ?? currentYear());
  const endRaw = num(fd, "end_year");
  // "fino all'anno" è facoltativo: vuoto (o uguale all'anno iniziale) = obiettivo di un solo anno
  const endYear = endRaw == null || Math.round(endRaw) === year ? null : Math.round(endRaw);
  if (endYear != null && endYear < year) {
    return { success: false, error: "L'ultimo anno non può essere prima dell'anno iniziale." };
  }

  const values = {
    title,
    category: oneOf(fd, "category", CATEGORIES, GOAL_SOURCE_META[source].category),
    source,
    target,
    manual_value: num(fd, "manual_value") ?? 0,
    year,
    end_year: endYear,
    show_on_home: fd.get("show_on_home") !== "no",
  };

  const id = str(fd, "id");
  const { data, error } = id
    ? await updateGoal(user.id, id, values)
    : await createGoal({ ...values, user_id: user.id });
  if (error || !data) return { success: false, error: "Salvataggio non riuscito. Riprova." };

  refresh();
  return { success: true, data: { id: data.id } };
}

export async function removeGoal(id: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Sessione scaduta. Accedi di nuovo." };
  const { error } = await deleteGoal(user.id, id);
  if (error) return { success: false, error: "Eliminazione non riuscita." };
  refresh();
  return { success: true, data: undefined };
}
