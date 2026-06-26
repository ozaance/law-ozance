-- =====================================================================
-- 0016 — Pause du chronomètre
-- Le chrono peut être mis en pause puis repris. On accumule le temps déjà
-- écoulé dans `accumulated_seconds` ; `started_at` à NULL signifie « en pause »
-- (sinon : segment en cours démarré à started_at).
-- =====================================================================

alter table public.active_timers
  add column if not exists accumulated_seconds integer not null default 0;

-- started_at devient nullable : NULL = chrono en pause.
alter table public.active_timers alter column started_at drop not null;
alter table public.active_timers alter column started_at drop default;
