"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getCurrentUser } from "@/services/auth.service";
import { createBlock, createPage, deleteBlock, deletePage, reorderBlocks, updateBlockContent, updatePage } from "@/services/pages.service";
import type { ActionResult } from "@/lib/action-result";
import { todayIso } from "@/lib/dates";
import type { Json } from "@/types/database.types";

const SECTIONS = ["general", "work", "life", "finance"] as const;
const BLOCK_TYPES = ["heading", "text", "checklist", "table", "gantt"] as const;

const pageSchema = z.object({
  title: z.string().trim().min(1, "Dai un titolo alla pagina").max(120),
  icon: z.string().trim().max(8).optional(),
  section: z.enum(SECTIONS),
});

// Contenuto iniziale per tipo di blocco: la forma è quella che l'editor si aspetta.
function defaultContent(type: (typeof BLOCK_TYPES)[number]): Json {
  const id = () => crypto.randomUUID();
  switch (type) {
    case "heading":
      return { text: "" };
    case "text":
      return { text: "" };
    case "checklist":
      return { items: [{ id: id(), text: "", done: false }] };
    case "gantt":
      return { title: "", items: [{ id: id(), name: "", start: todayIso(), days: 7, done: false, micro: false }] };
    case "table": {
      const c1 = id();
      const c2 = id();
      return {
        title: "",
        columns: [
          { id: c1, name: "Nome", type: "text" },
          { id: c2, name: "Valore", type: "number" },
        ],
        rows: [{ id: id(), cells: {} }],
      };
    }
  }
}

export async function createNewPage(input: unknown): Promise<ActionResult<{ id: string }>> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Sessione scaduta. Accedi di nuovo." };

  const parsed = pageSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const { data, error } = await createPage({
    user_id: user.id,
    title: parsed.data.title,
    icon: parsed.data.icon || null,
    section: parsed.data.section,
  });
  if (error || !data) return { success: false, error: "Creazione non riuscita. Riprova." };

  revalidatePath("/", "layout");
  return { success: true, data: { id: data.id } };
}

export async function editPage(pageId: string, input: unknown): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Sessione scaduta. Accedi di nuovo." };

  const parsed = pageSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const { error } = await updatePage(user.id, pageId, {
    title: parsed.data.title,
    icon: parsed.data.icon || null,
    section: parsed.data.section,
  });
  if (error) return { success: false, error: "Salvataggio non riuscito." };

  revalidatePath("/", "layout");
  return { success: true, data: undefined };
}

export async function removePage(pageId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Sessione scaduta. Accedi di nuovo." };
  const { error } = await deletePage(user.id, pageId);
  if (error) return { success: false, error: "Eliminazione non riuscita." };
  revalidatePath("/", "layout");
  return { success: true, data: undefined };
}

export async function addBlock(
  pageId: string,
  type: string
): Promise<ActionResult<{ id: string; type: string; content: Json; sort_order: number }>> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Sessione scaduta. Accedi di nuovo." };
  if (!(BLOCK_TYPES as readonly string[]).includes(type)) return { success: false, error: "Tipo di blocco non valido." };

  const { data, error } = await createBlock(user.id, pageId, type as (typeof BLOCK_TYPES)[number], defaultContent(type as (typeof BLOCK_TYPES)[number]));
  if (error || !data) return { success: false, error: "Impossibile aggiungere il blocco." };
  return { success: true, data: { id: data.id, type: data.type, content: data.content, sort_order: data.sort_order } };
}

export async function saveBlock(blockId: string, content: Json): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Sessione scaduta. Accedi di nuovo." };
  const { error } = await updateBlockContent(user.id, blockId, content);
  if (error) return { success: false, error: "Salvataggio non riuscito." };
  return { success: true, data: undefined };
}

export async function removeBlock(blockId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Sessione scaduta. Accedi di nuovo." };
  const { error } = await deleteBlock(user.id, blockId);
  if (error) return { success: false, error: "Eliminazione non riuscita." };
  return { success: true, data: undefined };
}

export async function saveBlockOrder(pageId: string, orderedIds: string[]): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Sessione scaduta. Accedi di nuovo." };
  const { error } = await reorderBlocks(user.id, pageId, orderedIds);
  if (error) return { success: false, error: "Riordino non riuscito." };
  return { success: true, data: undefined };
}
