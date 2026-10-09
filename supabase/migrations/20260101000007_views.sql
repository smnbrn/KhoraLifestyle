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
