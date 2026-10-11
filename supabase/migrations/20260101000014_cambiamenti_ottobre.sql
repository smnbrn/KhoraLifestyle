-- ================================================================
-- Cambiamenti di ottobre
--   1. Obiettivi su più anni            (goals.end_year)
--   2. Micro attività sotto le macro    (project_phases.parent_id)
--   3. Gantt nelle pagine               (page_blocks.type = 'gantt')
--   4. Giorno di incasso dell'affitto   (rentals.rent_day)
--   5. Tempo a giorni per le scadenze   (life_deadlines: inizio + giorni + congelamento)
--   6. Progetti con tutte le macro completate -> stato "completato"
-- È sicura da rieseguire: usa "if not exists" dove possibile.
-- Incollala nell'SQL Editor di Supabase ed eseguila una volta sola.
-- ================================================================

-- 1. Obiettivi che coprono più anni -------------------------------
alter table goals
  add column if not exists end_year integer;

alter table goals drop constraint if exists goals_end_year_check;
alter table goals
  add constraint goals_end_year_check check (end_year is null or end_year >= year);

-- 2. Micro attività: una macro attività "madre" -------------------
alter table project_phases
  add column if not exists parent_id uuid references project_phases(id) on delete cascade;
create index if not exists idx_project_phases_parent on project_phases(parent_id);

-- 3. Nuovo tipo di blocco per le pagine: Gantt --------------------
alter table page_blocks drop constraint if exists page_blocks_type_check;
alter table page_blocks
  add constraint page_blocks_type_check
  check (type in ('heading','text','checklist','table','gantt'));

-- 4. Affitti: giorno del mese in cui si incassa -------------------
alter table rentals
  add column if not exists rent_day smallint;

alter table rentals drop constraint if exists rentals_rent_day_check;
alter table rentals
  add constraint rentals_rent_day_check check (rent_day is null or (rent_day between 1 and 31));

-- 5. Scadenze (affitti/veicoli) con tempo a giorni come i progetti
alter table life_deadlines
  add column if not exists start_date date,
  add column if not exists duration_days integer,
  add column if not exists timeline_running boolean not null default true,
  add column if not exists frozen_since date,
  add column if not exists frozen_days integer not null default 0;

alter table life_deadlines drop constraint if exists life_deadlines_duration_days_check;
alter table life_deadlines
  add constraint life_deadlines_duration_days_check check (duration_days is null or duration_days >= 0);

alter table life_deadlines drop constraint if exists life_deadlines_frozen_days_check;
alter table life_deadlines
  add constraint life_deadlines_frozen_days_check check (frozen_days >= 0);

-- 6. Progetti già al 100% ma ancora "in corso" -> completati ------
update projects p
set status = 'completed'
where p.status in ('planned', 'in_progress', 'paused')
  and exists (
    select 1 from project_phases ph
    where ph.project_id = p.id and ph.parent_id is null
  )
  and not exists (
    select 1 from project_phases ph
    where ph.project_id = p.id and ph.parent_id is null and ph.completed = false
  );
