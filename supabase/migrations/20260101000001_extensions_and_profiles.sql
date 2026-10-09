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
