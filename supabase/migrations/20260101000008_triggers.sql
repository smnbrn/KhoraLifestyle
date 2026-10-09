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
