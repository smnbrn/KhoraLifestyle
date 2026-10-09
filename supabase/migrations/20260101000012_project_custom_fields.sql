-- Campi personalizzati per progetto: un JSONB invece di colonne fisse.
-- Scelta deliberata per chi non tocca il database — aggiungere un campo
-- diventa un'azione nell'interfaccia, non una migration. Il prezzo è che
-- non sono colonne "vere" (niente ordinamento/filtro SQL su di essi), ma
-- per campi occasionali su progetti particolari va benissimo.
alter table projects
  add column custom_fields jsonb not null default '{}'::jsonb;
