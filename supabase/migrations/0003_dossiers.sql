-- =====================================================================
-- LexFlow — Module Dossiers / Affaires
-- À exécuter dans Supabase SQL Editor (après 0002_clients.sql)
-- =====================================================================

do $$ begin
  create type public.type_affaire as enum (
    'conseil', 'contrat', 'ma', 'contentieux',
    'corporate', 'social', 'fiscal', 'recouvrement', 'autre'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.dossier_statut as enum (
    'ouvert', 'en_cours', 'en_attente', 'clos'
  );
exception when duplicate_object then null;
end $$;

create table if not exists public.dossiers (
  id             uuid primary key default gen_random_uuid(),
  cabinet_id     uuid not null default public.current_cabinet_id()
                   references public.cabinets (id) on delete cascade,
  client_id      uuid not null references public.clients (id) on delete cascade,
  avocat_id      uuid default auth.uid()
                   references public.profiles (id) on delete set null,
  reference      text,
  titre          text not null,
  type_affaire   public.type_affaire not null default 'conseil',
  statut         public.dossier_statut not null default 'ouvert',
  description    text,
  date_ouverture date not null default current_date,
  date_cloture   date,
  created_at     timestamptz not null default now(),
  created_by     uuid default auth.uid() references auth.users (id) on delete set null
);

create index if not exists dossiers_cabinet_idx on public.dossiers (cabinet_id);
create index if not exists dossiers_client_idx on public.dossiers (client_id);

-- Référence auto : AAAA-NNN, séquence par cabinet et par année
create or replace function public.set_dossier_reference()
returns trigger
language plpgsql
as $$
begin
  if new.reference is null or new.reference = '' then
    new.reference := to_char(now(), 'YYYY') || '-' || lpad((
      select count(*) + 1
      from public.dossiers d
      where d.cabinet_id = new.cabinet_id
        and date_part('year', d.created_at) = date_part('year', now())
    )::text, 3, '0');
  end if;
  return new;
end;
$$;

drop trigger if exists set_dossier_reference_trg on public.dossiers;
create trigger set_dossier_reference_trg
  before insert on public.dossiers
  for each row execute function public.set_dossier_reference();

-- =====================================================================
-- RLS — isolation par cabinet
-- =====================================================================
alter table public.dossiers enable row level security;

drop policy if exists "dossiers_select" on public.dossiers;
create policy "dossiers_select" on public.dossiers
  for select using (cabinet_id = public.current_cabinet_id());

drop policy if exists "dossiers_insert" on public.dossiers;
create policy "dossiers_insert" on public.dossiers
  for insert with check (cabinet_id = public.current_cabinet_id());

drop policy if exists "dossiers_update" on public.dossiers;
create policy "dossiers_update" on public.dossiers
  for update using (cabinet_id = public.current_cabinet_id());

drop policy if exists "dossiers_delete" on public.dossiers;
create policy "dossiers_delete" on public.dossiers
  for delete using (cabinet_id = public.current_cabinet_id());
