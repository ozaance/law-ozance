-- =====================================================================
-- 0012 — Dossier optionnel pour le chrono et les saisies de temps
-- Permet de démarrer un chrono sans dossier et d'attribuer le dossier
-- plus tard (pendant qu'il tourne ou après l'avoir arrêté).
-- =====================================================================

alter table public.active_timers alter column dossier_id drop not null;
alter table public.time_entries  alter column dossier_id drop not null;
