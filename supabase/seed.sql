-- ============================================================
-- SEED DI SVILUPPO — dati di esempio per vedere subito la dashboard popolata.
--
-- Come usarlo:
--   1. Registrati una volta nell'app (o dalla dashboard Supabase, sezione
--      Authentication > Users > Add user) con una email qualsiasi.
--   2. Copia l'UUID di quell'utente e incollalo qui sotto al posto di
--      'INCOLLA-QUI-IL-TUO-USER-ID'.
--   3. Esegui questo file (Supabase Studio > SQL Editor, oppure
--      `supabase db reset` se lo aggiungi al flusso locale).
--
-- Perché non creo io stesso l'utente in auth.users: la tabella auth.users di
-- Supabase ha una struttura interna che cambia leggermente tra versioni
-- (hashing password, identities collegate, ecc.). Appoggiarsi alla vera
-- registrazione è più robusto che replicarla a mano riga per riga.
-- ============================================================

do $$
declare
  v_user_id uuid := 'INCOLLA-QUI-IL-TUO-USER-ID'; -- <-- sostituisci
  v_client_1 uuid := gen_random_uuid();
  v_client_2 uuid := gen_random_uuid();
  v_project_1 uuid := gen_random_uuid();
  v_project_2 uuid := gen_random_uuid();
  v_quote_1 uuid := gen_random_uuid();
  v_invoice_1 uuid := gen_random_uuid();
  v_invoice_2 uuid := gen_random_uuid();
begin

  update profiles set
    company_name = 'Studio Demo',
    full_name = 'Utente Demo',
    vat_number = 'IT00000000000'
  where id = v_user_id;

  -- Clienti
  insert into clients (id, user_id, name, referent_name, email, city, vat_number) values
    (v_client_1, v_user_id, 'Rossi Costruzioni SRL', 'Marco Rossi', 'marco@rossicostruzioni.it', 'Milano', 'IT01234567890'),
    (v_client_2, v_user_id, 'Bianchi & Associati', 'Giulia Bianchi', 'giulia@bianchiassociati.it', 'Torino', 'IT09876543210');

  -- Progetti
  insert into projects (id, user_id, client_id, name, status, priority, start_date, expected_end_date, project_value) values
    (v_project_1, v_user_id, v_client_1, 'Sito vetrina aziendale', 'in_progress', 'high', current_date - 20, current_date + 10, 4500),
    (v_project_2, v_user_id, v_client_2, 'Gestionale interno', 'planned', 'medium', current_date + 5, current_date + 90, 12000);

  -- Task
  insert into tasks (user_id, project_id, client_id, title, status, priority, due_date) values
    (v_user_id, v_project_1, v_client_1, 'Bozza homepage', 'completed', 'high', current_date - 15),
    (v_user_id, v_project_1, v_client_1, 'Revisione contenuti', 'in_progress', 'medium', current_date + 3),
    (v_user_id, v_project_1, v_client_1, 'Test su mobile', 'todo', 'urgent', current_date + 1),
    (v_user_id, v_project_2, v_client_2, 'Raccolta requisiti', 'in_review', 'high', current_date + 7),
    (v_user_id, null, v_client_2, 'Chiamata di allineamento', 'todo', 'low', current_date + 2);

  -- Preventivo (con righe -> i trigger calcolano subtotal/vat/total da soli)
  insert into quotes (id, user_id, client_id, project_id, quote_number, expiry_date, status) values
    (v_quote_1, v_user_id, v_client_2, v_project_2, '2026-0001', current_date + 15, 'sent');
  insert into quote_items (user_id, quote_id, description, quantity, unit_price, vat_rate, sort_order) values
    (v_user_id, v_quote_1, 'Analisi e progettazione', 1, 2500, 22, 1),
    (v_user_id, v_quote_1, 'Sviluppo gestionale', 1, 8500, 22, 2),
    (v_user_id, v_quote_1, 'Formazione utenti', 4, 150, 22, 3);

  -- Fattura pagata (con un pagamento -> genera da sola la transazione entrata)
  insert into invoices (id, user_id, client_id, project_id, invoice_number, issue_date, due_date, status) values
    (v_invoice_1, v_user_id, v_client_1, v_project_1, '2026-0001', current_date - 10, current_date + 20, 'draft');
  insert into invoice_items (user_id, invoice_id, description, quantity, unit_price, vat_rate) values
    (v_user_id, v_invoice_1, 'Acconto 50% sito vetrina', 1, 2250, 22);
  insert into payments (user_id, invoice_id, amount, payment_date, payment_method) values
    (v_user_id, v_invoice_1, 2745, current_date - 8, 'bank_transfer');

  -- Fattura scaduta e non pagata (per vedere il caso "scaduta" in dashboard)
  insert into invoices (id, user_id, client_id, invoice_number, issue_date, due_date, status) values
    (v_invoice_2, v_user_id, v_client_2, '2025-0087', current_date - 60, current_date - 15, 'issued');
  insert into invoice_items (user_id, invoice_id, description, quantity, unit_price, vat_rate) values
    (v_user_id, v_invoice_2, 'Consulenza tecnica', 3, 400, 22);

  -- Uscite manuali (non collegate a fatture)
  insert into transactions (user_id, type, description, amount, transaction_date, project_id) values
    (v_user_id, 'expense', 'Licenza software design', 59.99, current_date - 12, v_project_1),
    (v_user_id, 'expense', 'Dominio e hosting annuale', 120.00, current_date - 30, v_project_1),
    (v_user_id, 'expense', 'Commercialista - competenze', 350.00, current_date - 5, null);

  -- Commissione da pagare
  insert into commissions (user_id, description, amount, percentage, client_id, project_id) values
    (v_user_id, 'Segnalazione cliente Bianchi & Associati', 500, 10, v_client_2, v_project_2);

  raise notice 'Seed completato per utente %', v_user_id;
end $$;
