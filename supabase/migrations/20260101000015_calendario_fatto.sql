-- ================================================================
-- Calendario: eventi che si possono spuntare come "Fatto"
--   events.completed_at  (null = da fare)
-- È sicura da rieseguire. Incollala nell'SQL Editor di Supabase ed eseguila una volta sola.
-- ================================================================
alter table events
  add column if not exists completed_at timestamptz;
