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
