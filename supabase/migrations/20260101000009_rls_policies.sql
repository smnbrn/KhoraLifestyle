-- Pattern identico su tutte le tabelle: l'utente vede/modifica solo i propri dati.
-- Le tabelle "figlie" (quote_items, invoice_items) hanno anch'esse user_id
-- diretto, quindi nessuna policy richiede subquery/join.

do $$
declare
  tbl text;
  tables text[] := array[
    'clients','projects','tasks','events','quotes','quote_items',
    'invoices','invoice_items','payments','transaction_categories',
    'transactions','commissions','documents','notes','document_counters'
  ];
begin
  foreach tbl in array tables loop
    execute format('alter table %I enable row level security', tbl);
    execute format(
      'create policy "%s_select_own" on %I for select using (auth.uid() = user_id)',
      tbl, tbl
    );
    execute format(
      'create policy "%s_insert_own" on %I for insert with check (auth.uid() = user_id)',
      tbl, tbl
    );
    execute format(
      'create policy "%s_update_own" on %I for update using (auth.uid() = user_id) with check (auth.uid() = user_id)',
      tbl, tbl
    );
    execute format(
      'create policy "%s_delete_own" on %I for delete using (auth.uid() = user_id)',
      tbl, tbl
    );
  end loop;
end $$;

-- profiles usa "id" invece di "user_id"
alter table profiles enable row level security;
create policy "profiles_select_own" on profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on profiles for update using (auth.uid() = id) with check (auth.uid() = id);
