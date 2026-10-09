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
