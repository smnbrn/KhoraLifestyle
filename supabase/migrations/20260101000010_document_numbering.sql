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
