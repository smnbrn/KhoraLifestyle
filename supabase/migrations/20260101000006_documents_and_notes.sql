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
