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
