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
