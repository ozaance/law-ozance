-- =====================================================================
-- LexFlow — Module Clients & Prospects
-- À exécuter dans Supabase SQL Editor (après schema.sql)
-- =====================================================================

-- Type de client : personne morale (entreprise) ou physique (particulier)
do $$ begin
  create type public.client_type as enum ('entreprise', 'particulier');
exception when duplicate_object then null;
end $$;

create table if not exists public.clients (
  id              uuid primary key default gen_random_uuid(),
  cabinet_id      uuid not null default public.current_cabinet_id()
                    references public.cabinets (id) on delete cascade,
  type            public.client_type not null default 'entreprise',
  -- Raison sociale (entreprise) ou nom complet (particulier)
  nom             text not null,
  -- Champs entreprise (optionnels)
  siren           text,
  forme_juridique text,
  -- Coordonnées
  email           text,
  telephone       text,
  notes           text,
  created_at      timestamptz not null default now(),
  created_by      uuid default auth.uid() references auth.users (id) on delete set null
);

create index if not exists clients_cabinet_idx on public.clients (cabinet_id);

-- =====================================================================
-- RLS — chaque cabinet ne voit/gère que ses propres clients
-- =====================================================================
alter table public.clients enable row level security;

drop policy if exists "clients_select" on public.clients;
create policy "clients_select" on public.clients
  for select using (cabinet_id = public.current_cabinet_id());

drop policy if exists "clients_insert" on public.clients;
create policy "clients_insert" on public.clients
  for insert with check (cabinet_id = public.current_cabinet_id());

drop policy if exists "clients_update" on public.clients;
create policy "clients_update" on public.clients
  for update using (cabinet_id = public.current_cabinet_id());

drop policy if exists "clients_delete" on public.clients;
create policy "clients_delete" on public.clients
  for delete using (cabinet_id = public.current_cabinet_id());
