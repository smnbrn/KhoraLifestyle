-- Bucket per i documenti: privato (non public), l'accesso passa sempre da
-- URL firmati a scadenza generati server-side, mai da un link diretto.
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

-- Percorso dei file: "{user_id}/{nome-file}" — la policy isola ogni
-- utente controllando che il primo segmento della cartella corrisponda al
-- proprio auth.uid(), stesso principio della RLS sulle tabelle.
create policy "documents_storage_select_own"
on storage.objects for select
using (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "documents_storage_insert_own"
on storage.objects for insert
with check (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "documents_storage_delete_own"
on storage.objects for delete
using (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);
