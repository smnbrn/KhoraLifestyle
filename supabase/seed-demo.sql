-- ================================================================
-- DATI DI PROVA PER LE SCHERMATE (screenshot / demo)
--
-- Riempie TUTTE le sezioni dell'app con dati inventati: clienti, progetti con
-- macro e micro attività, task, calendario, fatture, entrate e uscite,
-- investimenti, obiettivi, affitti, veicoli, viaggi, allenamenti e pagine.
-- Le date sono relative a OGGI, quindi il calendario del mese corrente
-- mostra voci verdi (completate), rosse (scadute) e arancio (in corso).
--
-- COME USARLO
--   1. Crea un account di prova (registrati nell'app con una email a parte,
--      es. demo@esempio.it). NON usare il tuo account vero.
--   2. Scrivi qui sotto quella email al posto di 'demo@esempio.it'.
--   3. Incolla tutto nell'SQL Editor di Supabase ed esegui UNA volta.
--
-- REQUISITI: devono essere già applicate tutte le migrazioni fino alla 15
-- (campi per obiettivi su più anni, micro attività, Gantt, giorno di incasso
-- dell'affitto, tempo a giorni delle scadenze, eventi "fatto").
--
-- SICUREZZA: lo script si rifiuta di partire se l'account contiene già dei dati
-- (così non mescola dati finti con dati veri). Per rifarlo, cancella prima
-- l'account di prova e ricrealo.
-- ================================================================

do $$
declare
  v_email text := 'simonebruni14gen@gmail.com';   -- <-- la email dell'account di prova

  v_user uuid;
  v_year int := extract(year from current_date)::int;
  v_today date := current_date;

  c1 uuid := gen_random_uuid(); c2 uuid := gen_random_uuid(); c3 uuid := gen_random_uuid();
  c4 uuid := gen_random_uuid(); c5 uuid := gen_random_uuid();

  p1 uuid := gen_random_uuid(); p2 uuid := gen_random_uuid(); p3 uuid := gen_random_uuid();
  p4 uuid := gen_random_uuid(); p5 uuid := gen_random_uuid();

  ph_front uuid := gen_random_uuid(); ph_proto uuid := gen_random_uuid();

  k1 uuid := gen_random_uuid(); k2 uuid := gen_random_uuid(); k3 uuid := gen_random_uuid();
  k4 uuid := gen_random_uuid(); k5 uuid := gen_random_uuid();

  q1 uuid := gen_random_uuid(); q2 uuid := gen_random_uuid();
  i1 uuid := gen_random_uuid(); i2 uuid := gen_random_uuid(); i3 uuid := gen_random_uuid(); i4 uuid := gen_random_uuid();

  r1 uuid := gen_random_uuid(); r2 uuid := gen_random_uuid();
  ve1 uuid := gen_random_uuid(); ve2 uuid := gen_random_uuid();
  inv1 uuid := gen_random_uuid(); inv2 uuid := gen_random_uuid(); inv3 uuid := gen_random_uuid();
  t1 uuid := gen_random_uuid(); t2 uuid := gen_random_uuid(); t3 uuid := gen_random_uuid();
  pg1 uuid := gen_random_uuid(); pg2 uuid := gen_random_uuid(); pg3 uuid := gen_random_uuid();

  cat_inc uuid; cat_sw uuid; cat_forn uuid; cat_mkt uuid; cat_att uuid; cat_cons uuid; cat_tasse uuid;
begin
  select id into v_user from auth.users where lower(email) = lower(v_email);
  if v_user is null then
    raise exception 'Nessun account con email %. Registralo prima nell''app, poi correggi v_email.', v_email;
  end if;

  if exists (select 1 from clients where user_id = v_user)
     or exists (select 1 from projects where user_id = v_user)
     or exists (select 1 from tasks where user_id = v_user) then
    raise exception 'L''account % contiene già dei dati. Usa un account di prova vuoto.', v_email;
  end if;

  -- ---------------------------------------------------------------
  -- Profilo
  -- ---------------------------------------------------------------
  update profiles set
    full_name = 'Luca Demo', company_name = 'Studio Demo', vat_number = 'IT00000000000',
    city = 'Torino', province = 'TO', country = 'Italia'
  where id = v_user;

  -- ---------------------------------------------------------------
  -- Categorie (le stesse che l'app crea da sola alla prima visita)
  -- ---------------------------------------------------------------
  insert into transaction_categories (user_id, name, type, is_default)
  select v_user, n, 'income', true from unnest(array['Pagamento cliente','Vendita','Altro']) n
  on conflict do nothing;
  insert into transaction_categories (user_id, name, type, is_default)
  select v_user, n, 'expense', true
  from unnest(array['Software','Fornitori','Marketing','Pubblicità','Attrezzatura','Consulenze','Commissioni','Tasse','Altro']) n
  on conflict do nothing;

  select id into cat_inc from transaction_categories where user_id = v_user and name = 'Pagamento cliente' and type = 'income';
  select id into cat_sw from transaction_categories where user_id = v_user and name = 'Software' and type = 'expense';
  select id into cat_forn from transaction_categories where user_id = v_user and name = 'Fornitori' and type = 'expense';
  select id into cat_mkt from transaction_categories where user_id = v_user and name = 'Marketing' and type = 'expense';
  select id into cat_att from transaction_categories where user_id = v_user and name = 'Attrezzatura' and type = 'expense';
  select id into cat_cons from transaction_categories where user_id = v_user and name = 'Consulenze' and type = 'expense';
  select id into cat_tasse from transaction_categories where user_id = v_user and name = 'Tasse' and type = 'expense';

  -- ---------------------------------------------------------------
  -- Clienti
  -- ---------------------------------------------------------------
  insert into clients (id, user_id, name, referent_name, email, phone, vat_number, city, province, address, postal_code, notes, created_at) values
    (c1, v_user, 'Rossi Costruzioni SRL', 'Marco Rossi', 'marco@rossicostruzioni.example', '+39 011 555 0101', 'IT01234567890', 'Milano', 'MI', 'Via Garibaldi 14', '20121', 'Cliente storico, preferisce le call al mattino.', now() - interval '200 days'),
    (c2, v_user, 'Bianchi & Associati', 'Giulia Bianchi', 'giulia@bianchiassociati.example', '+39 011 555 0102', 'IT09876543210', 'Torino', 'TO', 'Corso Francia 80', '10138', null, now() - interval '150 days'),
    (c3, v_user, 'Verdi Studio', 'Anna Verdi', 'anna@verdistudio.example', '+39 02 555 0103', 'IT05551234567', 'Bologna', 'BO', 'Via Indipendenza 5', '40121', 'Rebranding in corso.', now() - interval '90 days'),
    (c4, v_user, 'Neri Ristorazione', 'Paolo Neri', 'paolo@neriristorazione.example', '+39 055 555 0104', 'IT07771234567', 'Firenze', 'FI', 'Via dei Servi 22', '50122', null, now() - interval '40 days'),
    (c5, v_user, 'Gialli Eventi', 'Sara Gialli', 'sara@gialli.example', '+39 06 555 0105', null, 'Roma', 'RM', null, null, null, now() - interval '12 days');

  -- ---------------------------------------------------------------
  -- Progetti (tempo a giorni: inizio + durata, uno congelato, uno completato)
  -- ---------------------------------------------------------------
  insert into projects (id, user_id, client_id, name, description, status, priority, start_date, duration_days, expected_end_date, project_value, budget, timeline_running, frozen_since, frozen_days, actual_end_date, custom_fields) values
    (p1, v_user, c1, 'Sito web Rossi Costruzioni', 'Nuovo sito vetrina con portfolio lavori e form contatti.', 'in_progress', 'high', v_today - 25, 45, v_today + 20, 6500, 4200, true, null, 0, null, '{"Tecnologia":"Next.js","Hosting":"Vercel"}'::jsonb),
    (p2, v_user, c2, 'App prenotazioni Bianchi', 'Web app per gestire appuntamenti e promemoria ai clienti.', 'in_progress', 'urgent', v_today - 12, 60, v_today + 48, 9800, 6500, true, null, 0, null, '{}'::jsonb),
    (p3, v_user, c3, 'Rebranding Verdi Studio', 'Logo, palette e linee guida. Attesa feedback del cliente: tempo congelato.', 'in_progress', 'medium', v_today - 20, 30, v_today + 13, 3200, 1800, false, v_today - 4, 3, null, '{}'::jsonb),
    (p4, v_user, c4, 'Gestionale ordini Neri', 'Gestionale interno per ordini e fornitori.', 'planned', 'medium', v_today + 6, 90, v_today + 96, 14000, 9000, true, null, 0, null, '{}'::jsonb),
    (p5, v_user, c5, 'Campagna social Gialli Eventi', 'Piano editoriale e gestione social per tre mesi.', 'completed', 'low', v_today - 100, 60, v_today - 40, 2400, 1200, true, null, 0, v_today - 38, '{}'::jsonb);

  -- Macro attività (Gantt) con micro attività
  insert into project_phases (id, user_id, project_id, parent_id, name, start_date, duration_days, completed, completed_at, sort_order, timeline_running) values
    (gen_random_uuid(), v_user, p1, null, 'Analisi e design', v_today - 25, 10, true, now() - interval '14 days', 1, true),
    (ph_front,          v_user, p1, null, 'Sviluppo frontend', v_today - 14, 22, false, null, 2, true),
    (gen_random_uuid(), v_user, p1, null, 'Test e collaudo', v_today + 6, 8, false, null, 3, true),
    (gen_random_uuid(), v_user, p1, null, 'Pubblicazione', v_today + 15, 5, false, null, 4, true);
  insert into project_phases (user_id, project_id, parent_id, name, start_date, duration_days, completed, completed_at, sort_order) values
    (v_user, p1, ph_front, 'Homepage', v_today - 14, 6, true, now() - interval '8 days', 5),
    (v_user, p1, ph_front, 'Pagine servizi', v_today - 8, 8, false, null, 6),
    (v_user, p1, ph_front, 'Form contatti', v_today - 1, 6, false, null, 7);

  insert into project_phases (id, user_id, project_id, parent_id, name, start_date, duration_days, completed, completed_at, sort_order) values
    (gen_random_uuid(), v_user, p2, null, 'Raccolta requisiti', v_today - 12, 8, true, now() - interval '4 days', 1),
    (ph_proto,          v_user, p2, null, 'Prototipo', v_today - 4, 14, false, null, 2),
    (gen_random_uuid(), v_user, p2, null, 'Sviluppo', v_today + 10, 30, false, null, 3);
  insert into project_phases (user_id, project_id, parent_id, name, start_date, duration_days, completed, sort_order) values
    (v_user, p2, ph_proto, 'Schermate principali', v_today - 4, 7, false, 4),
    (v_user, p2, ph_proto, 'Test con utenti', v_today + 3, 6, false, 5);

  insert into project_phases (user_id, project_id, name, start_date, duration_days, completed, sort_order) values
    (v_user, p3, 'Brand identity', v_today - 20, 14, false, 1),
    (v_user, p3, 'Linee guida', v_today - 4, 10, false, 2);

  insert into project_phases (user_id, project_id, name, start_date, duration_days, completed, completed_at, sort_order) values
    (v_user, p5, 'Piano editoriale', v_today - 100, 20, true, now() - interval '80 days', 1),
    (v_user, p5, 'Pubblicazione contenuti', v_today - 80, 40, true, now() - interval '40 days', 2);

  -- ---------------------------------------------------------------
  -- Rubrica
  -- ---------------------------------------------------------------
  insert into contacts (id, user_id, name, kind, company, role, email, phone, client_id) values
    (k1, v_user, 'Marco Rossi', 'client', 'Rossi Costruzioni SRL', 'Titolare', 'marco@rossicostruzioni.example', '+39 011 555 0101', c1),
    (k2, v_user, 'Elena Ferri', 'collaborator', 'Freelance', 'Graphic designer', 'elena@ferri.example', '+39 333 555 0201', null),
    (k3, v_user, 'Davide Colombo', 'collaborator', 'Freelance', 'Sviluppatore backend', 'davide@colombo.example', '+39 333 555 0202', null),
    (k4, v_user, 'Print & Co', 'supplier', 'Print & Co SRL', 'Tipografia', 'ordini@printco.example', '+39 011 555 0203', null),
    (k5, v_user, 'Giulia Bianchi', 'client', 'Bianchi & Associati', 'Referente progetto', 'giulia@bianchiassociati.example', '+39 011 555 0102', c2);
  insert into project_contacts (user_id, project_id, contact_id, role) values
    (v_user, p1, k1, 'Referente cliente'), (v_user, p1, k2, 'Design'),
    (v_user, p2, k5, 'Referente cliente'), (v_user, p2, k3, 'Backend'),
    (v_user, p3, k2, 'Design');

  -- ---------------------------------------------------------------
  -- Task (inizio + giorni; uno solo con data di inizio, uno congelato, uno scaduto)
  -- ---------------------------------------------------------------
  insert into tasks (user_id, project_id, client_id, title, description, status, priority, start_date, duration_days, timeline_running, frozen_since, frozen_days, due_date) values
    (v_user, p1, c1, 'Bozza homepage', 'Prima versione approvata dal cliente.', 'completed', 'high', v_today - 25, 6, true, null, 0, v_today - 19),
    (v_user, p1, c1, 'Revisione contenuti', 'Testi e foto dei cantieri da rivedere.', 'in_progress', 'medium', v_today - 3, 6, true, null, 0, v_today + 3),
    (v_user, p1, c1, 'Test su mobile', null, 'todo', 'urgent', v_today + 2, 4, true, null, 0, v_today + 6),
    (v_user, p2, c2, 'Raccolta requisiti', 'Elenco funzioni e priorità.', 'in_review', 'high', v_today - 6, 9, true, null, 0, v_today + 3),
    (v_user, null, c2, 'Chiamata di allineamento', null, 'todo', 'low', v_today + 1, 0, true, null, 0, v_today + 1),
    (v_user, p3, c3, 'Preparare fattura acconto', 'Da inviare appena il cliente conferma.', 'todo', 'high', v_today - 12, 5, true, null, 0, v_today - 7),
    (v_user, p3, c3, 'Logo: varianti', 'In attesa di feedback: tempo congelato.', 'in_progress', 'medium', v_today - 10, 12, false, v_today - 4, 2, v_today + 4),
    (v_user, p1, c1, 'Aggiornare plugin sito', null, 'completed', 'low', v_today - 8, 3, true, null, 0, v_today - 5),
    (v_user, p2, c2, 'Studio dei concorrenti', null, 'in_progress', 'medium', v_today - 5, 10, true, null, 0, v_today + 5),
    (v_user, p2, c2, 'Riunione di sprint', null, 'todo', 'medium', v_today + 3, 0, true, null, 0, v_today + 3),
    (v_user, null, null, 'Report mensile', 'Scadenza fissa senza data di inizio.', 'todo', 'low', null, null, true, null, 0, v_today + 8);

  -- ---------------------------------------------------------------
  -- Eventi del calendario (uno fatto, uno scaduto)
  -- ---------------------------------------------------------------
  insert into events (user_id, title, description, event_date, event_time, event_type, client_id, completed_at) values
    (v_user, 'Call con Rossi', 'Aggiornamento sul sito.', v_today + 2, '10:30', 'meeting', c1, null),
    (v_user, 'Demo al cliente Bianchi', 'Presentazione del prototipo.', v_today + 5, '15:00', 'meeting', c2, null),
    (v_user, 'Backup server', null, v_today + 7, null, 'reminder', null, null),
    (v_user, 'Scadenza tasse del trimestre', null, v_today + 9, null, 'reminder', null, null),
    (v_user, 'Pranzo con il commercialista', null, v_today - 3, '13:00', 'other', null, now() - interval '3 days'),
    (v_user, 'Consegna materiale Verdi Studio', null, v_today - 2, null, 'other', c3, null);

  -- ---------------------------------------------------------------
  -- Preventivi
  -- ---------------------------------------------------------------
  insert into quotes (id, user_id, client_id, project_id, quote_number, issue_date, expiry_date, status, notes) values
    (q1, v_user, c4, p4, v_year || '-0001', v_today - 20, v_today + 10, 'sent', 'Validità 30 giorni.'),
    (q2, v_user, c2, p2, v_year || '-0002', v_today - 40, v_today - 10, 'accepted', null);
  insert into quote_items (user_id, quote_id, description, quantity, unit_price, vat_rate, sort_order) values
    (v_user, q1, 'Analisi e progettazione', 1, 3000, 22, 1),
    (v_user, q1, 'Sviluppo gestionale', 1, 9500, 22, 2),
    (v_user, q1, 'Formazione utenti', 4, 150, 22, 3),
    (v_user, q2, 'Sviluppo app prenotazioni', 1, 9800, 22, 1);

  -- ---------------------------------------------------------------
  -- Fatture: una pagata, una pagata a metà, una in scadenza, una scaduta
  -- ---------------------------------------------------------------
  insert into invoices (id, user_id, client_id, project_id, invoice_number, issue_date, due_date, status) values
    (i1, v_user, c1, p1, v_year || '-0001', v_today - 40, v_today - 10, 'issued'),
    (i2, v_user, c2, p2, v_year || '-0002', v_today - 15, v_today + 15, 'issued'),
    (i3, v_user, c5, p5, v_year || '-0003', v_today - 70, v_today - 40, 'issued'),
    (i4, v_user, c3, p3, v_year || '-0004', v_today - 60, v_today - 25, 'issued');
  insert into invoice_items (user_id, invoice_id, description, quantity, unit_price, vat_rate, sort_order) values
    (v_user, i1, 'Acconto 50% sito vetrina', 1, 3250, 22, 1),
    (v_user, i2, 'Acconto app prenotazioni', 1, 4000, 22, 1),
    (v_user, i3, 'Gestione social: saldo', 1, 2400, 22, 1),
    (v_user, i4, 'Brand identity: prima tranche', 1, 1600, 22, 1);

  -- Pagamenti: generano da soli le entrate collegate
  insert into payments (id, user_id, invoice_id, amount, payment_date, payment_method) values
    (pg1, v_user, i1, 3965, v_today - 9, 'bank_transfer'),      -- fattura 1: pagata per intero
    (pg2, v_user, i2, 2000, v_today - 5, 'bank_transfer'),      -- fattura 2: pagata a metà
    (pg3, v_user, i3, 2928, v_today - 38, 'bank_transfer');     -- fattura 3: pagata per intero
  update transactions set category_id = cat_inc where user_id = v_user and payment_id is not null;
  -- la fattura 4 resta "da incassare" e scaduta

  -- ---------------------------------------------------------------
  -- Entrate e uscite degli ultimi 6 mesi (per i grafici)
  -- ---------------------------------------------------------------
  insert into transactions (user_id, type, category_id, description, amount, transaction_date, client_id)
  select v_user, 'income', cat_inc,
         (array['Consulenza mensile','Manutenzione sito','Sviluppo a corpo','Formazione','Consulenza strategica','Canone assistenza'])[g],
         (array[1900,2350,3100,1650,2800,2200])[g],
         date_trunc('month', v_today)::date - ((g - 1) * 30) + 6,
         (array[c1,c2,c3,c4,c5,c1])[g]
  from generate_series(1, 6) g
  where date_trunc('month', v_today)::date - ((g - 1) * 30) + 6 <= v_today;

  insert into transactions (user_id, type, category_id, description, amount, transaction_date) values
    (v_user, 'expense', cat_sw,    'Abbonamento software di design',   59.99,  v_today - 4),
    (v_user, 'expense', cat_sw,    'Hosting e dominio',                120.00, v_today - 16),
    (v_user, 'expense', cat_att,   'Monitor 27 pollici',               329.00, v_today - 22),
    (v_user, 'expense', cat_cons,  'Commercialista',                   350.00, v_today - 26),
    (v_user, 'expense', cat_mkt,   'Campagna pubblicitaria',           180.00, v_today - 35),
    (v_user, 'expense', cat_forn,  'Stampa materiale promozionale',    240.00, v_today - 48),
    (v_user, 'expense', cat_tasse, 'Acconto imposte',                  900.00, v_today - 60),
    (v_user, 'expense', cat_sw,    'Abbonamento software di design',   59.99,  v_today - 64),
    (v_user, 'expense', cat_cons,  'Commercialista',                   350.00, v_today - 86),
    (v_user, 'expense', cat_att,   'Tastiera e mouse',                 145.00, v_today - 101),
    (v_user, 'expense', cat_mkt,   'Sponsorizzazione social',          210.00, v_today - 120),
    (v_user, 'expense', cat_tasse, 'Saldo imposte',                    1150.00, v_today - 150);

  -- Commissioni
  insert into commissions (user_id, description, amount, percentage, client_id, project_id, status, commission_date) values
    (v_user, 'Segnalazione cliente Bianchi & Associati', 500, 10, c2, p2, 'to_pay', v_today - 6),
    (v_user, 'Segnalazione Verdi Studio', 320, 10, c3, p3, 'paid', v_today - 45);

  -- Note
  insert into notes (user_id, content, client_id, project_id) values
    (v_user, 'Il cliente preferisce essere contattato al mattino, dopo le 9.', c1, null),
    (v_user, 'Da confermare con Elena le tavole del logo prima di venerdì.', null, p3),
    (v_user, 'Idea: proporre un contratto di manutenzione annuale dopo la consegna.', null, p1);

  -- ---------------------------------------------------------------
  -- Obiettivi (alcuni automatici, uno su più anni)
  -- ---------------------------------------------------------------
  insert into goals (user_id, title, category, source, target, manual_value, year, end_year, show_on_home, sort_order) values
    (v_user, 'Guadagni', 'finance', 'income_year', 30000, 0, v_year, null, true, 1),
    (v_user, 'Investimenti', 'finance', 'invested_year', 6000, 0, v_year, null, true, 2),
    (v_user, 'Workout', 'life', 'gym_days', 150, 0, v_year, null, true, 3),
    (v_user, 'Giorni di viaggio', 'life', 'travel_days', 30, 0, v_year, null, true, 4),
    (v_user, 'Clienti acquisiti', 'work', 'clients_acquired', 12, 0, v_year, null, true, 5),
    (v_user, 'Libri letti', 'general', 'manual', 24, 14, v_year, null, true, 6),
    (v_user, 'Fatturato triennale', 'finance', 'income_year', 120000, 0, v_year, v_year + 2, true, 7);

  -- ---------------------------------------------------------------
  -- Investimenti
  -- ---------------------------------------------------------------
  insert into investments (user_id, name, kind, current_value, notes) values
    (v_user, 'ETF azionario mondo', 'etf', 5420.00, 'Piano di accumulo mensile.'),
    (v_user, 'Obbligazioni governative', 'bonds', 2150.00, null),
    (v_user, 'Crypto (quota piccola)', 'crypto', 860.00, null);


  insert into investment_movements (user_id, investment_id, movement_date, kind, amount, notes)
  select v_user, i.id, v_today - (m.g * 30), 'deposit', m.amt, null
  from investments i
  join (values ('ETF azionario mondo', 1, 300), ('ETF azionario mondo', 2, 300), ('ETF azionario mondo', 3, 300),
               ('ETF azionario mondo', 4, 300), ('Obbligazioni governative', 2, 1500), ('Obbligazioni governative', 5, 600),
               ('Crypto (quota piccola)', 3, 500)) as m(name, g, amt)
    on m.name = i.name
  where i.user_id = v_user;
  insert into investment_movements (user_id, investment_id, movement_date, kind, amount, notes)
  select v_user, id, v_today - 20, 'withdrawal', 150, 'Prelievo parziale' from investments
  where user_id = v_user and name like 'Crypto%';

  -- ---------------------------------------------------------------
  -- Vita: affitti (con giorno di incasso), veicoli, scadenze
  -- ---------------------------------------------------------------
  insert into rentals (id, user_id, name, address, tenant_name, rent_amount, rent_frequency, rent_day, contract_start, contract_end, imu_amount) values
    (r1, v_user, 'Appartamento Via Roma 12', 'Via Roma 12, Torino', 'Famiglia Conti', 650, 'monthly', 5, v_today - 300, v_today + 65, 420),
    (r2, v_user, 'Box auto Via Po', 'Via Po 40, Torino', 'Sig. Marchetti', 90, 'monthly', 10, v_today - 200, v_today + 160, null);

  insert into vehicles (id, user_id, name, plate, kind) values
    (ve1, v_user, 'Fiat Panda', 'AB123CD', 'car'),
    (ve2, v_user, 'Vespa 125', 'ZZ456XY', 'motorbike');

  insert into life_deadlines (user_id, rental_id, vehicle_id, kind, title, due_date, amount, recurrence, start_date, duration_days, completed_at, last_paid_at) values
    (v_user, r1, null, 'imu', 'IMU appartamento', v_today + 14, 420, 'yearly', null, null, null, null),
    (v_user, r1, null, 'other', 'Rinnovo contratto', v_today + 15, null, 'none', v_today - 20, 35, null, null),
    (v_user, null, ve1, 'insurance', 'Assicurazione Panda', v_today + 9, 480, 'yearly', null, null, null, v_today - 356),
    (v_user, null, ve1, 'bollo', 'Bollo auto', v_today - 3, 190, 'yearly', null, null, null, v_today - 368),
    (v_user, null, ve1, 'service', 'Tagliando', v_today + 25, 220, 'yearly', v_today - 5, 30, null, null),
    (v_user, null, ve2, 'inspection', 'Revisione Vespa', v_today - 12, 80, 'none', null, null, now() - interval '10 days', v_today - 10);

  -- ---------------------------------------------------------------
  -- Allenamenti: circa un giorno su due negli ultimi due mesi
  -- ---------------------------------------------------------------
  insert into workouts (user_id, workout_date, kind, notes)
  select v_user, d::date,
         (array['Petto e tricipiti','Gambe','Schiena e bicipiti','Calisthenics','Spalle'])[1 + (extract(doy from d)::int % 5)],
         null
  from generate_series(v_today - 70, v_today, interval '1 day') d
  where (extract(doy from d)::int % 2 = 0 or extract(doy from d)::int % 7 = 0)
    and extract(year from d)::int = v_year
  on conflict do nothing;

  -- ---------------------------------------------------------------
  -- Viaggi
  -- ---------------------------------------------------------------
  insert into trips (id, user_id, name, destination, start_date, end_date, status, budget, notes) values
    (t1, v_user, 'Gita sul Lago Maggiore', 'Stresa', v_today + 6, v_today + 7, 'planned', 220, 'Giornata in barca con gli amici.'),
    (t2, v_user, 'Weekend a Lisbona', 'Lisbona', v_today + 24, v_today + 27, 'booked', 650, null),
    (t3, v_user, 'Vacanza a Madrid', 'Madrid', v_today - 60, v_today - 54, 'done', 900, null);
  insert into trip_items (user_id, trip_id, kind, title, item_date, cost, booked) values
    (v_user, t1, 'transport', 'Treno Torino - Stresa', v_today + 6, 18, true),
    (v_user, t1, 'activity', 'Giro in barca sulle isole', v_today + 6, 35, false),
    (v_user, t2, 'transport', 'Volo andata e ritorno', v_today + 24, 240, true),
    (v_user, t2, 'stay', 'Hotel in centro, 3 notti', v_today + 24, 280, true),
    (v_user, t2, 'activity', 'Tram 28 e quartiere Alfama', v_today + 25, 0, false),
    (v_user, t2, 'todo', 'Controllare i documenti di viaggio', null, null, false);

  -- ---------------------------------------------------------------
  -- Pagine personalizzate con blocchi (titolo, testo, checklist, tabella, Gantt)
  -- ---------------------------------------------------------------
  with pg as (
    insert into pages (user_id, title, icon, section, sort_order) values
      (v_user, 'Idee e appunti', '💡', 'general', 1),
      (v_user, 'Budget vacanze', '🌴', 'finance', 2),
      (v_user, 'Piano di lancio', '🚀', 'work', 3)
    returning id, title
  )
  insert into page_blocks (user_id, page_id, type, content, sort_order)
  select v_user, pg.id, b.type, b.content, b.ord
  from pg
  join lateral (
    values
      ('Idee e appunti', 'heading',   jsonb_build_object('text', 'Da fare questo mese'), 1),
      ('Idee e appunti', 'text',      jsonb_build_object('text', 'Raccolgo qui le idee per i nuovi progetti e le cose da non dimenticare.'), 2),
      ('Idee e appunti', 'checklist', jsonb_build_object('items', jsonb_build_array(
          jsonb_build_object('id', gen_random_uuid()::text, 'text', 'Aggiornare il portfolio', 'done', true),
          jsonb_build_object('id', gen_random_uuid()::text, 'text', 'Scrivere ai clienti per i rinnovi', 'done', false),
          jsonb_build_object('id', gen_random_uuid()::text, 'text', 'Prenotare la revisione dell''auto', 'done', false))), 3),
      ('Budget vacanze', 'heading',   jsonb_build_object('text', 'Spese previste'), 1),
      ('Budget vacanze', 'table',     (
          select jsonb_build_object('title', 'Lisbona',
                 'columns', jsonb_build_array(
                    jsonb_build_object('id', 'c-voce', 'name', 'Voce', 'type', 'text'),
                    jsonb_build_object('id', 'c-importo', 'name', 'Importo', 'type', 'currency'),
                    jsonb_build_object('id', 'c-pagato', 'name', 'Pagato', 'type', 'checkbox')),
                 'rows', jsonb_build_array(
                    jsonb_build_object('id', gen_random_uuid()::text, 'cells', jsonb_build_object('c-voce', 'Volo', 'c-importo', 240, 'c-pagato', true)),
                    jsonb_build_object('id', gen_random_uuid()::text, 'cells', jsonb_build_object('c-voce', 'Hotel', 'c-importo', 280, 'c-pagato', true)),
                    jsonb_build_object('id', gen_random_uuid()::text, 'cells', jsonb_build_object('c-voce', 'Ristoranti', 'c-importo', 120, 'c-pagato', false)),
                    jsonb_build_object('id', gen_random_uuid()::text, 'cells', jsonb_build_object('c-voce', 'Trasporti locali', 'c-importo', 30, 'c-pagato', false))))), 2),
      ('Piano di lancio', 'heading',  jsonb_build_object('text', 'Lancio del nuovo servizio'), 1),
      ('Piano di lancio', 'gantt',    jsonb_build_object('title', 'Roadmap', 'items', jsonb_build_array(
          jsonb_build_object('id', gen_random_uuid()::text, 'name', 'Preparazione', 'start', (v_today - 10)::text, 'days', 12, 'done', true, 'micro', false),
          jsonb_build_object('id', gen_random_uuid()::text, 'name', 'Pagina di presentazione', 'start', (v_today - 8)::text, 'days', 6, 'done', true, 'micro', true),
          jsonb_build_object('id', gen_random_uuid()::text, 'name', 'Materiale grafico', 'start', (v_today - 4)::text, 'days', 8, 'done', false, 'micro', true),
          jsonb_build_object('id', gen_random_uuid()::text, 'name', 'Comunicazione', 'start', (v_today + 2)::text, 'days', 14, 'done', false, 'micro', false),
          jsonb_build_object('id', gen_random_uuid()::text, 'name', 'Lancio', 'start', (v_today + 17)::text, 'days', 3, 'done', false, 'micro', false))), 2)
  ) as b(title, type, content, ord) on b.title = pg.title;

  raise notice 'Dati di prova inseriti per % (utente %)', v_email, v_user;
end $$;
