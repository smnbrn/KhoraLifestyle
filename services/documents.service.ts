import "server-only";

import { createClient } from "@/lib/supabase/server";

export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/msword",
  "application/vnd.ms-excel",
];

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export type DocumentLink = {
  clientId?: string | null;
  projectId?: string | null;
  quoteId?: string | null;
  invoiceId?: string | null;
};

export async function uploadDocument(userId: string, file: File, link: DocumentLink) {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return { error: new Error("Tipo di file non consentito. Sono ammessi PDF, JPG, PNG, DOCX, XLSX.") };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { error: new Error("Il file supera la dimensione massima di 10 MB.") };
  }

  const supabase = await createClient();
  // Percorso "{user_id}/{uuid}-{nome originale}": evita collisioni tra file
  // con lo stesso nome mantenendo il nome originale leggibile. Il primo
  // segmento è quello che la RLS di storage.objects controlla.
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const storagePath = `${userId}/${crypto.randomUUID()}-${safeName}`;

  const { error: uploadError } = await supabase.storage.from("documents").upload(storagePath, file, {
    contentType: file.type,
  });
  if (uploadError) return { error: uploadError };

  const { data, error: dbError } = await supabase
    .from("documents")
    .insert({
      user_id: userId,
      file_name: file.name,
      storage_path: storagePath,
      mime_type: file.type,
      file_size: file.size,
      client_id: link.clientId || null,
      project_id: link.projectId || null,
      quote_id: link.quoteId || null,
      invoice_id: link.invoiceId || null,
    })
    .select()
    .single();

  if (dbError || !data) {
    // Compensazione: senza la riga DB il file caricato sarebbe orfano e
    // invisibile all'app, quindi lo rimuoviamo per non lasciare rifiuti nello
    // Storage.
    await supabase.storage.from("documents").remove([storagePath]);
    return { error: dbError ?? new Error("Salvataggio non riuscito") };
  }

  return { data };
}

export async function listDocumentsByClient(userId: string, clientId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("documents")
    .select("*")
    .eq("user_id", userId)
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function listDocumentsByProject(userId: string, projectId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("documents")
    .select("*")
    .eq("user_id", userId)
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function listAllDocuments(
  userId: string,
  options: { search?: string; page?: number; pageSize?: number } = {}
) {
  const supabase = await createClient();
  const { search, page = 1, pageSize = 20 } = options;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("documents")
    .select("*, clients(name), projects(name), quotes(quote_number), invoices(invoice_number)", { count: "exact" })
    .eq("user_id", userId);

  if (search) query = query.ilike("file_name", `%${search.replace(/[,()]/g, " ").trim()}%`);

  const { data, count } = await query.order("created_at", { ascending: false }).range(from, to);
  return { documents: data ?? [], total: count ?? 0, pageSize };
}

export async function getSignedDownloadUrl(storagePath: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.storage.from("documents").createSignedUrl(storagePath, 60);
  if (error || !data) return null;
  return data.signedUrl;
}

export async function deleteDocument(userId: string, documentId: string) {
  const supabase = await createClient();
  const { data: doc } = await supabase
    .from("documents")
    .select("storage_path")
    .eq("user_id", userId)
    .eq("id", documentId)
    .single();

  if (!doc) return { error: new Error("Documento non trovato") };

  await supabase.storage.from("documents").remove([doc.storage_path]);
  return supabase.from("documents").delete().eq("user_id", userId).eq("id", documentId);
}

export type DocumentListItem = {
  id: string;
  file_name: string;
  mime_type: string | null;
  file_size: number | null;
  storage_path: string;
  created_at: string;
  clients: { name: string } | null;
  projects: { name: string } | null;
  quotes: { quote_number: string } | null;
  invoices: { invoice_number: string } | null;
};
