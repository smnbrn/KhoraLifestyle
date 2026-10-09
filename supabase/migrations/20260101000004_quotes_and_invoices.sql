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
