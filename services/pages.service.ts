import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Database, Json } from "@/types/database.types";

type Tables = Database["public"]["Tables"];
export type PageRow = Tables["pages"]["Row"];
export type BlockRow = Tables["page_blocks"]["Row"];

export async function listPages(userId: string): Promise<PageRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("pages")
    .select("*")
    .eq("user_id", userId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  return data ?? [];
}

export async function getPage(userId: string, pageId: string) {
  const supabase = await createClient();
  const { data: page } = await supabase.from("pages").select("*").eq("user_id", userId).eq("id", pageId).single();
  if (!page) return null;
  const { data: blocks } = await supabase
    .from("page_blocks")
    .select("*")
    .eq("user_id", userId)
    .eq("page_id", pageId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  return { page, blocks: blocks ?? [] };
}

export async function createPage(values: Tables["pages"]["Insert"]) {
  const supabase = await createClient();
  return supabase.from("pages").insert(values).select().single();
}

export async function updatePage(userId: string, id: string, values: Tables["pages"]["Update"]) {
  const supabase = await createClient();
  return supabase.from("pages").update(values).eq("user_id", userId).eq("id", id).select().single();
}

export async function deletePage(userId: string, id: string) {
  const supabase = await createClient();
  return supabase.from("pages").delete().eq("user_id", userId).eq("id", id);
}

export async function createBlock(userId: string, pageId: string, type: BlockRow["type"], content: Json) {
  const supabase = await createClient();
  const { data: last } = await supabase
    .from("page_blocks")
    .select("sort_order")
    .eq("user_id", userId)
    .eq("page_id", pageId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  return supabase
    .from("page_blocks")
    .insert({ user_id: userId, page_id: pageId, type, content, sort_order: (last?.sort_order ?? -1) + 1 })
    .select()
    .single();
}

export async function updateBlockContent(userId: string, blockId: string, content: Json) {
  const supabase = await createClient();
  return supabase.from("page_blocks").update({ content }).eq("user_id", userId).eq("id", blockId);
}

export async function deleteBlock(userId: string, blockId: string) {
  const supabase = await createClient();
  return supabase.from("page_blocks").delete().eq("user_id", userId).eq("id", blockId);
}

/** Salva il nuovo ordine dei blocchi (un update per blocco: pochi elementi per pagina). */
export async function reorderBlocks(userId: string, pageId: string, orderedIds: string[]) {
  const supabase = await createClient();
  const results = await Promise.all(
    orderedIds.map((id, index) =>
      supabase.from("page_blocks").update({ sort_order: index }).eq("user_id", userId).eq("page_id", pageId).eq("id", id)
    )
  );
  return { error: results.find((r) => r.error)?.error ?? null };
}
