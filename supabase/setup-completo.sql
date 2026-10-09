-- ============================================================
-- SETUP COMPLETO DATABASE — incolla questo intero file
-- nell'SQL Editor di Supabase ed esegui (Run). Combina tutte
-- le migration del progetto in ordine, in un unico passaggio.
-- ============================================================


-- ==== 20260101000001_extensions_and_profiles.sql ====
-- Estensioni necessarie
create extension if not exists "pgcrypto";

-- ================================================================
-- PROFILES — dati azienda/professionista, estende auth.users
-- ================================================================
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  company_name text,
  vat_number text,
  tax_code text,
  address text,
  city text,
  postal_code text,
  province text,
  country text not null default 'Italia',
  phone text,
  logo_url text,
  default_vat_rate numeric(5,2) not null default 22.00,
  invoice_number_prefix text not null default '',
  quote_number_prefix text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Crea automaticamente la riga profiles quando un utente si registra
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ==== 20260101000002_clients_and_projects.sql ====
-- ================================================================
-- CLIENTI
-- ================================================================
create table clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  referent_name text,
  email text,
  phone text,
  vat_number text,
  tax_code text,
  address text,
  city text,
  postal_code text,
  province text,
  country text not null default 'Italia',
  notes text,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_clients_user_id on clients(user_id);
create index idx_clients_search on clients using gin (to_tsvector('italian', name || ' ' || coalesce(referent_name,'')));

-- ================================================================
-- PROGETTI
-- ================================================================
create table projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null references clients(id) on delete restrict,
  name text not null,
  description text,
  status text not null default 'planned'
    check (status in ('planned','in_progress','paused','completed','cancelled')),
  priority text not null default 'medium'
    check (priority in ('low','medium','high','urgent')),
  start_date date,
  expected_end_date date,
  actual_end_date date,
  budget numeric(12,2),
  project_value numeric(12,2) not null default 0,
  notes text,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_projects_user_id on projects(user_id);
create index idx_projects_client_id on projects(client_id);
create index idx_projects_status on projects(user_id, status);

-- ==== 20260101000003_tasks_and_events.sql ====
-- ================================================================
-- TASK
-- ================================================================
create table tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references projects(id) on delete cascade,
  client_id uuid references clients(id) on delete set null,
  title text not null,
  description text,
  status text not null default 'todo'
    check (status in ('todo','in_progress','in_review','completed')),
  priority text not null default 'medium'
    check (priority in ('low','medium','high','urgent')),
  due_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_tasks_user_id on tasks(user_id);
create index idx_tasks_project_id on tasks(project_id);
create index idx_tasks_due on tasks(user_id, due_date) where status <> 'completed';

-- ================================================================
-- EVENTI CALENDARIO — solo eventi custom (le scadenze di
-- task/fatture/progetti si leggono dalle tabelle originali via query)
-- ================================================================
create table events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  event_date date not null,
  event_time time,
  event_type text not null default 'other'
    check (event_type in ('meeting','reminder','other')),
  client_id uuid references clients(id) on delete set null,
  project_id uuid references projects(id) on delete set null,
  task_id uuid references tasks(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_events_user_date on events(user_id, event_date);

-- ==== 20260101000004_quotes_and_invoices.sql ====
-- ================================================================
-- CONTATORI NUMERAZIONE — per preventivi e fatture progressivi
-- ================================================================
create table document_counters (
  user_id uuid not null references auth.users(id) on delete cascade,
  document_type text not null check (document_type in ('quote','invoice')),
  year integer not null,
  last_number integer not null default 0,
  primary key (user_id, document_type, year)
);

-- ================================================================
-- PREVENTIVI
-- ================================================================
create table quotes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null references clients(id) on delete restrict,
  project_id uuid references projects(id) on delete set null,
  quote_number text not null,
  issue_date date not null default current_date,
  expiry_date date,
  status text not null default 'draft'
    check (status in ('draft','sent','accepted','rejected','expired')),
  subtotal numeric(12,2) not null default 0,
  vat_amount numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, quote_number)
);
create index idx_quotes_user_id on quotes(user_id);
create index idx_quotes_client_id on quotes(client_id);
create index idx_quotes_status on quotes(user_id, status);

create table quote_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  quote_id uuid not null references quotes(id) on delete cascade,
  description text not null,
  quantity numeric(10,2) not null default 1 check (quantity > 0),
  unit_price numeric(12,2) not null default 0 check (unit_price >= 0),
  discount_percent numeric(5,2) not null default 0 check (discount_percent between 0 and 100),
  vat_rate numeric(5,2) not null default 22.00 check (vat_rate >= 0),
  line_total numeric(12,2) not null default 0,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index idx_quote_items_quote_id on quote_items(quote_id);

-- ================================================================
-- FATTURE
-- ================================================================
create table invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null references clients(id) on delete restrict,
  project_id uuid references projects(id) on delete set null,
  quote_id uuid references quotes(id) on delete set null,
  invoice_number text not null,
  issue_date date not null default current_date,
  due_date date,
  status text not null default 'draft'
    check (status in ('draft','issued','partially_paid','paid','overdue','cancelled')),
  subtotal numeric(12,2) not null default 0,
  vat_amount numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  paid_amount numeric(12,2) not null default 0,
  remaining_amount numeric(12,2) generated always as (total - paid_amount) stored,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, invoice_number)
);
create index idx_invoices_user_id on invoices(user_id);
create index idx_invoices_client_id on invoices(client_id);
create index idx_invoices_status on invoices(user_id, status);
create index idx_invoices_due on invoices(user_id, due_date) where status not in ('paid','cancelled');

create table invoice_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  invoice_id uuid not null references invoices(id) on delete cascade,
  description text not null,
  quantity numeric(10,2) not null default 1 check (quantity > 0),
  unit_price numeric(12,2) not null default 0 check (unit_price >= 0),
  discount_percent numeric(5,2) not null default 0 check (discount_percent between 0 and 100),
  vat_rate numeric(5,2) not null default 22.00 check (vat_rate >= 0),
  line_total numeric(12,2) not null default 0,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index idx_invoice_items_invoice_id on invoice_items(invoice_id);

-- ==== 20260101000005_payments_and_finance.sql ====
-- ================================================================
-- PAGAMENTI
-- ================================================================
create table payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  invoice_id uuid not null references invoices(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  payment_date date not null default current_date,
  payment_method text not null default 'bank_transfer'
    check (payment_method in ('bank_transfer','card','cash','paypal','other')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_payments_invoice_id on payments(invoice_id);
create index idx_payments_user_id on payments(user_id);

-- ================================================================
-- CATEGORIE TRANSAZIONI
-- ================================================================
create table transaction_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null check (type in ('income','expense')),
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, name, type)
);

-- ================================================================
-- TRANSAZIONI — registro unico di entrate/uscite
-- ================================================================
create table transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('income','expense')),
  category_id uuid references transaction_categories(id) on delete set null,
  description text,
  amount numeric(12,2) not null check (amount > 0),
  transaction_date date not null default current_date,
  client_id uuid references clients(id) on delete set null,
  project_id uuid references projects(id) on delete set null,
  invoice_id uuid references invoices(id) on delete set null,
  payment_id uuid references payments(id) on delete cascade,
  payment_method text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_transactions_user_date on transactions(user_id, transaction_date);
create index idx_transactions_type on transactions(user_id, type);
create unique index idx_transactions_payment_id on transactions(payment_id) where payment_id is not null;

-- ================================================================
-- COMMISSIONI
-- ================================================================
create table commissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  description text not null,
  amount numeric(12,2) not null check (amount >= 0),
  percentage numeric(5,2),
  commission_date date not null default current_date,
  client_id uuid references clients(id) on delete set null,
  project_id uuid references projects(id) on delete set null,
  status text not null default 'to_pay' check (status in ('to_pay','paid')),
  transaction_id uuid references transactions(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_commissions_user_id on commissions(user_id);

-- ==== 20260101000006_documents_and_notes.sql ====
-- ================================================================
-- DOCUMENTI — Supabase Storage, FK dirette (non associazione polimorfica)
-- ================================================================
create table documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  file_name text not null,
  storage_path text not null,
  mime_type text,
  file_size bigint,
  client_id uuid references clients(id) on delete cascade,
  project_id uuid references projects(id) on delete cascade,
  quote_id uuid references quotes(id) on delete cascade,
  invoice_id uuid references invoices(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index idx_documents_user_id on documents(user_id);
create index idx_documents_client_id on documents(client_id);
create index idx_documents_project_id on documents(project_id);

-- ================================================================
-- NOTE — log cronologico multiplo su Cliente/Progetto
-- ================================================================
create table notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  client_id uuid references clients(id) on delete cascade,
  project_id uuid references projects(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_notes_client_id on notes(client_id);
create index idx_notes_project_id on notes(project_id);

-- ==== 20260101000007_views.sql ====
-- Costi e profitto di progetto: MAI salvati come colonna statica,
-- sempre calcolati dalle transazioni collegate.
create view project_financials
with (security_invoker = true) as
select
  p.id as project_id,
  p.project_value,
  coalesce(sum(t.amount) filter (where t.type = 'expense'), 0) as costs_incurred,
  p.project_value - coalesce(sum(t.amount) filter (where t.type = 'expense'), 0) as profit
from projects p
left join transactions t on t.project_id = p.id
group by p.id, p.project_value;

-- Totali cliente per la pagina di dettaglio
create view client_financials
with (security_invoker = true) as
select
  c.id as client_id,
  coalesce(sum(i.total) filter (where i.status <> 'cancelled'), 0) as total_invoiced,
  coalesce(sum(i.paid_amount) filter (where i.status <> 'cancelled'), 0) as total_collected,
  coalesce(sum(i.remaining_amount) filter (where i.status <> 'cancelled'), 0) as total_outstanding
from clients c
left join invoices i on i.client_id = c.id
group by c.id;

-- ==== 20260101000008_triggers.sql ====
-- ================================================================
-- updated_at automatico su tutte le tabelle che lo hanno
-- ================================================================
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$
declare
  t text;
begin
  for t in
    select table_name from information_schema.columns
    where column_name = 'updated_at' and table_schema = 'public'
  loop
    execute format(
      'create trigger trg_set_updated_at before update on %I for each row execute function set_updated_at()',
      t
    );
  end loop;
end $$;

-- ================================================================
-- Ricalcolo totali preventivo dalle righe
-- ================================================================
create or replace function fn_recalc_quote_totals()
returns trigger as $$
declare
  v_quote_id uuid := coalesce(new.quote_id, old.quote_id);
  v_subtotal numeric(12,2);
  v_vat numeric(12,2);
begin
  select
    coalesce(sum(quantity * unit_price * (1 - discount_percent / 100.0)), 0),
    coalesce(sum(quantity * unit_price * (1 - discount_percent / 100.0) * vat_rate / 100.0), 0)
  into v_subtotal, v_vat
  from quote_items where quote_id = v_quote_id;

  update quotes
  set subtotal = v_subtotal, vat_amount = v_vat, total = v_subtotal + v_vat
  where id = v_quote_id;

  return null;
end;
$$ language plpgsql;

create trigger trg_recalc_quote_totals
  after insert or update or delete on quote_items
  for each row execute function fn_recalc_quote_totals();

-- ================================================================
-- Ricalcolo totali fattura dalle righe (stesso principio)
-- ================================================================
create or replace function fn_recalc_invoice_totals()
returns trigger as $$
declare
  v_invoice_id uuid := coalesce(new.invoice_id, old.invoice_id);
  v_subtotal numeric(12,2);
  v_vat numeric(12,2);
begin
  select
    coalesce(sum(quantity * unit_price * (1 - discount_percent / 100.0)), 0),
    coalesce(sum(quantity * unit_price * (1 - discount_percent / 100.0) * vat_rate / 100.0), 0)
  into v_subtotal, v_vat
  from invoice_items where invoice_id = v_invoice_id;

  update invoices
  set subtotal = v_subtotal, vat_amount = v_vat, total = v_subtotal + v_vat
  where id = v_invoice_id;

  return null;
end;
$$ language plpgsql;

create trigger trg_recalc_invoice_totals
  after insert or update or delete on invoice_items
  for each row execute function fn_recalc_invoice_totals();

-- ================================================================
-- Sync pagamenti -> stato/importo pagato fattura
-- ================================================================
create or replace function fn_sync_invoice_payment_status()
returns trigger as $$
declare
  v_invoice_id uuid := coalesce(new.invoice_id, old.invoice_id);
  v_total numeric(12,2);
  v_paid numeric(12,2);
begin
  select coalesce(sum(amount), 0) into v_paid from payments where invoice_id = v_invoice_id;
  select total into v_total from invoices where id = v_invoice_id;

  update invoices
  set paid_amount = v_paid,
      status = case
        when v_paid >= v_total and v_total > 0 then 'paid'
        when v_paid > 0 then 'partially_paid'
        else status
      end
  where id = v_invoice_id
    and status not in ('cancelled');

  return null;
end;
$$ language plpgsql;

create trigger trg_sync_invoice_payment_status
  after insert or update or delete on payments
  for each row execute function fn_sync_invoice_payment_status();

-- ================================================================
-- Genera automaticamente una transazione "entrata" da ogni pagamento
-- ================================================================
create or replace function fn_create_transaction_from_payment()
returns trigger as $$
declare
  v_invoice invoices%rowtype;
begin
  select * into v_invoice from invoices where id = new.invoice_id;

  insert into transactions (
    user_id, type, description, amount, transaction_date,
    client_id, project_id, invoice_id, payment_id, payment_method
  ) values (
    new.user_id, 'income',
    'Incasso fattura ' || v_invoice.invoice_number,
    new.amount, new.payment_date,
    v_invoice.client_id, v_invoice.project_id, new.invoice_id, new.id,
    new.payment_method
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_create_transaction_from_payment
  after insert on payments
  for each row execute function fn_create_transaction_from_payment();

-- ==== 20260101000009_rls_policies.sql ====
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

-- ==== 20260101000010_document_numbering.sql ====
-- Numerazione progressiva preventivi/fatture: un'unica istruzione atomica
-- (INSERT ... ON CONFLICT ... DO UPDATE ... RETURNING) evita race condition
-- tra richieste concorrenti. Nessun security definer: gira con i permessi
-- di chi chiama, e le policy RLS già esistenti su document_counters bastano
-- perché auth.uid() coincide sempre con lo user_id scritto.
create or replace function get_next_document_number(p_document_type text, p_year integer)
returns integer as $$
declare
  v_number integer;
begin
  insert into document_counters (user_id, document_type, year, last_number)
  values (auth.uid(), p_document_type, p_year, 1)
  on conflict (user_id, document_type, year)
  do update set last_number = document_counters.last_number + 1
  returning last_number into v_number;

  return v_number;
end;
$$ language plpgsql;

-- ==== 20260101000011_documents_storage.sql ====
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

-- ==== 20260101000012_project_custom_fields.sql ====
-- Campi personalizzati per progetto: un JSONB invece di colonne fisse.
-- Scelta deliberata per chi non tocca il database — aggiungere un campo
-- diventa un'azione nell'interfaccia, non una migration. Il prezzo è che
-- non sono colonne "vere" (niente ordinamento/filtro SQL su di essi), ma
-- per campi occasionali su progetti particolari va benissimo.
alter table projects
  add column custom_fields jsonb not null default '{}'::jsonb;

-- ===== 20260101000013_second_brain.sql =====
-- ================================================================
-- SECOND BRAIN — obiettivi, rubrica, scadenze a giorni, macro attività,
-- pagine personalizzabili, investimenti, sezione Vita.
-- Pattern identico alle migration precedenti: user_id + RLS + updated_at.
-- ================================================================

-- ----------------------------------------------------------------
-- 1. TEMPO "A GIORNI" su progetti e task
--    end = start + duration_days + frozen_days (+ giorni di blocco in corso)
--    Il calcolo vive in lib/timeline.ts (una sola implementazione).
-- ----------------------------------------------------------------
alter table projects
  add column duration_days integer check (duration_days is null or duration_days >= 0),
  add column timeline_running boolean not null default true,
  add column frozen_since date,
  add column frozen_days integer not null default 0 check (frozen_days >= 0);

alter table tasks
  add column start_date date,
  add column duration_days integer check (duration_days is null or duration_days >= 0),
  add column timeline_running boolean not null default true,
  add column frozen_since date,
  add column frozen_days integer not null default 0 check (frozen_days >= 0);

-- ----------------------------------------------------------------
-- 2. MACRO ATTIVITÀ di progetto (righe del Gantt)
-- ----------------------------------------------------------------
create table project_phases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  name text not null,
  start_date date not null,
  duration_days integer not null default 1 check (duration_days >= 1),
  timeline_running boolean not null default true,
  frozen_since date,
  frozen_days integer not null default 0 check (frozen_days >= 0),
  completed boolean not null default false,
  completed_at timestamptz,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_project_phases_project on project_phases(project_id);
create index idx_project_phases_user on project_phases(user_id);

-- ----------------------------------------------------------------
-- 3. RUBRICA — persone coinvolgibili nei progetti
-- ----------------------------------------------------------------
create table contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  kind text not null default 'other'
    check (kind in ('client','collaborator','supplier','other')),
  company text,
  role text,
  email text,
  phone text,
  client_id uuid references clients(id) on delete set null,
  notes text,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_contacts_user on contacts(user_id);

create table project_contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  contact_id uuid not null references contacts(id) on delete cascade,
  role text,
  created_at timestamptz not null default now(),
  unique (project_id, contact_id)
);
create index idx_project_contacts_project on project_contacts(project_id);
create index idx_project_contacts_contact on project_contacts(contact_id);

-- ----------------------------------------------------------------
-- 4. OBIETTIVI (anno) — alcuni si calcolano da soli (source != 'manual')
-- ----------------------------------------------------------------
create table goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  category text not null default 'general'
    check (category in ('general','work','life','finance')),
  source text not null default 'manual'
    check (source in ('manual','income_year','invested_year','gym_days','travel_days','clients_acquired')),
  target numeric(14,2) not null check (target > 0),
  manual_value numeric(14,2) not null default 0,
  year integer not null default extract(year from now())::integer,
  show_on_home boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_goals_user_year on goals(user_id, year);

-- ----------------------------------------------------------------
-- 5. INVESTIMENTI
-- ----------------------------------------------------------------
create table investments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  kind text not null default 'other'
    check (kind in ('etf','stocks','bonds','crypto','real_estate','cash','other')),
  current_value numeric(14,2),
  notes text,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_investments_user on investments(user_id);

create table investment_movements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  investment_id uuid not null references investments(id) on delete cascade,
  movement_date date not null default current_date,
  kind text not null default 'deposit' check (kind in ('deposit','withdrawal')),
  amount numeric(14,2) not null check (amount > 0),
  notes text,
  created_at timestamptz not null default now()
);
create index idx_investment_movements_inv on investment_movements(investment_id);
create index idx_investment_movements_user_date on investment_movements(user_id, movement_date);

-- ----------------------------------------------------------------
-- 6. VITA — affitti, veicoli, scadenze, allenamenti, viaggi
-- ----------------------------------------------------------------
create table rentals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  address text,
  tenant_name text,
  rent_amount numeric(12,2) not null default 0 check (rent_amount >= 0),
  rent_frequency text not null default 'monthly'
    check (rent_frequency in ('monthly','quarterly','yearly')),
  contract_start date,
  contract_end date,
  imu_amount numeric(12,2),
  notes text,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_rentals_user on rentals(user_id);

create table vehicles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  plate text,
  kind text not null default 'car' check (kind in ('car','motorbike','other')),
  notes text,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_vehicles_user on vehicles(user_id);

-- Scadenze ricorrenti di affitti e veicoli (IMU, assicurazione, bollo, tagliando…)
create table life_deadlines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  rental_id uuid references rentals(id) on delete cascade,
  vehicle_id uuid references vehicles(id) on delete cascade,
  kind text not null default 'other'
    check (kind in ('imu','rent','insurance','bollo','service','inspection','other')),
  title text not null,
  due_date date not null,
  amount numeric(12,2),
  recurrence text not null default 'yearly'
    check (recurrence in ('none','monthly','quarterly','yearly')),
  last_paid_at date,
  completed_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- una scadenza appartiene a un affitto OPPURE a un veicolo
  check ((rental_id is not null)::int + (vehicle_id is not null)::int = 1)
);
create index idx_life_deadlines_user_due on life_deadlines(user_id, due_date);
create index idx_life_deadlines_rental on life_deadlines(rental_id);
create index idx_life_deadlines_vehicle on life_deadlines(vehicle_id);

create table workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workout_date date not null,
  kind text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, workout_date)
);
create index idx_workouts_user_date on workouts(user_id, workout_date);

create table trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  destination text,
  start_date date,
  end_date date,
  status text not null default 'idea'
    check (status in ('idea','planned','booked','done')),
  budget numeric(12,2),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date is null or start_date is null or end_date >= start_date)
);
create index idx_trips_user on trips(user_id);

create table trip_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  trip_id uuid not null references trips(id) on delete cascade,
  kind text not null default 'activity'
    check (kind in ('transport','stay','activity','todo','other')),
  title text not null,
  item_date date,
  cost numeric(12,2),
  booked boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_trip_items_trip on trip_items(trip_id);

-- ----------------------------------------------------------------
-- 7. PAGINE PERSONALIZZABILI (second brain): pagine + blocchi
--    Blocchi: heading, text, checklist, table (contenuto in jsonb)
-- ----------------------------------------------------------------
create table pages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Senza titolo',
  icon text,
  section text not null default 'general'
    check (section in ('general','work','life','finance')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_pages_user on pages(user_id);

create table page_blocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  page_id uuid not null references pages(id) on delete cascade,
  type text not null check (type in ('heading','text','checklist','table')),
  content jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_page_blocks_page on page_blocks(page_id, sort_order);

-- ----------------------------------------------------------------
-- updated_at automatico (la migration 8 copre solo le tabelle allora esistenti)
-- ----------------------------------------------------------------
do $$
declare
  t text;
  tables text[] := array[
    'project_phases','contacts','goals','investments','rentals','vehicles',
    'life_deadlines','workouts','trips','trip_items','pages','page_blocks'
  ];
begin
  foreach t in array tables loop
    execute format(
      'create trigger trg_set_updated_at before update on %I for each row execute function set_updated_at()', t
    );
  end loop;
end $$;

-- ----------------------------------------------------------------
-- Row Level Security: stesso pattern di tutte le altre tabelle
-- ----------------------------------------------------------------
do $$
declare
  tbl text;
  tables text[] := array[
    'project_phases','contacts','project_contacts','goals','investments',
    'investment_movements','rentals','vehicles','life_deadlines','workouts',
    'trips','trip_items','pages','page_blocks'
  ];
begin
  foreach tbl in array tables loop
    execute format('alter table %I enable row level security', tbl);
    execute format('create policy "%s_select_own" on %I for select using (auth.uid() = user_id)', tbl, tbl);
    execute format('create policy "%s_insert_own" on %I for insert with check (auth.uid() = user_id)', tbl, tbl);
    execute format('create policy "%s_update_own" on %I for update using (auth.uid() = user_id) with check (auth.uid() = user_id)', tbl, tbl);
    execute format('create policy "%s_delete_own" on %I for delete using (auth.uid() = user_id)', tbl, tbl);
  end loop;
end $$;
