-- =====================================================================
-- 0013 — Leads (demandes « Parler à un conseiller » depuis la landing)
-- =====================================================================

create table if not exists public.leads (
  id         uuid primary key default gen_random_uuid(),
  nom        text,
  cabinet    text,
  email      text,
  telephone  text,
  message    text,
  source     text,
  created_at timestamptz not null default now()
);

-- RLS activée sans policy : la table n'est accessible que via la service_role
-- (insertion par l'action serveur ; lecture côté admin/back-office uniquement).
alter table public.leads enable row level security;
