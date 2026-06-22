-- =====================================================================
-- LexFlow — Module Agenda & Échéances
-- =====================================================================

do $$ begin
  create type public.evenement_type as enum (
    'echeance', 'rendez_vous', 'audience', 'tache'
  );
exception when duplicate_object then null;
end $$;

create table if not exists public.evenements (
  id             uuid primary key default gen_random_uuid(),
  cabinet_id     uuid not null default public.current_cabinet_id()
                   references public.cabinets (id) on delete cascade,
  dossier_id     uuid references public.dossiers (id) on delete cascade,
  assigne_a      uuid default auth.uid()
                   references public.profiles (id) on delete set null,
  type           public.evenement_type not null default 'echeance',
  titre          text not null,
  date_evenement date not null,
  heure          time,
  lieu           text,
  termine        boolean not null default false,
  notes          text,
  created_at     timestamptz not null default now(),
  created_by     uuid default auth.uid() references auth.users (id) on delete set null
);

create index if not exists evenements_cabinet_idx on public.evenements (cabinet_id);
create index if not exists evenements_dossier_idx on public.evenements (dossier_id);
create index if not exists evenements_date_idx on public.evenements (date_evenement);

-- =====================================================================
-- RLS — isolation par cabinet
-- =====================================================================
alter table public.evenements enable row level security;

drop policy if exists "evenements_select" on public.evenements;
create policy "evenements_select" on public.evenements
  for select using (cabinet_id = public.current_cabinet_id());

drop policy if exists "evenements_insert" on public.evenements;
create policy "evenements_insert" on public.evenements
  for insert with check (cabinet_id = public.current_cabinet_id());

drop policy if exists "evenements_update" on public.evenements;
create policy "evenements_update" on public.evenements
  for update using (cabinet_id = public.current_cabinet_id());

drop policy if exists "evenements_delete" on public.evenements;
create policy "evenements_delete" on public.evenements
  for delete using (cabinet_id = public.current_cabinet_id());
