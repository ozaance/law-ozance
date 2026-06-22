-- =====================================================================
-- LexFlow — Schéma fondation (multi-tenant + RLS)
-- À exécuter dans Supabase : SQL Editor > New query > coller > Run
-- =====================================================================

-- 1. CABINETS (le "tenant")
create table if not exists public.cabinets (
  id          uuid primary key default gen_random_uuid(),
  nom         text not null,
  created_at  timestamptz not null default now()
);

-- 2. PROFILS (1 ligne par utilisateur, lié à auth.users)
do $$ begin
  create type public.role_cabinet as enum ('admin', 'avocat', 'assistant');
exception when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  cabinet_id  uuid references public.cabinets (id) on delete set null,
  email       text,
  nom_complet text,
  role        public.role_cabinet not null default 'avocat',
  created_at  timestamptz not null default now()
);

-- 3. Helper : cabinet_id de l'utilisateur courant (SECURITY DEFINER => pas de récursion RLS)
create or replace function public.current_cabinet_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select cabinet_id from public.profiles where id = auth.uid();
$$;

-- 4. Création automatique du profil à l'inscription
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, nom_complet)
  values (new.id, new.email, new.raw_user_meta_data ->> 'nom_complet');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 5. Création d'un cabinet + rattachement de l'utilisateur (1er onboarding)
create or replace function public.create_cabinet(nom text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Authentification requise';
  end if;

  if (select cabinet_id from public.profiles where id = uid) is not null then
    raise exception 'Vous appartenez déjà à un cabinet';
  end if;

  insert into public.cabinets (nom) values (nom) returning id into new_id;
  update public.profiles
    set cabinet_id = new_id, role = 'admin'
    where id = uid;
  return new_id;
end;
$$;

-- La création de cabinet est réservée aux utilisateurs connectés.
revoke execute on function public.create_cabinet(text) from anon;

-- =====================================================================
-- RLS — isolation stricte par cabinet
-- =====================================================================
alter table public.cabinets enable row level security;
alter table public.profiles enable row level security;

-- CABINETS : on ne voit que le sien
drop policy if exists "cabinet_select_own" on public.cabinets;
create policy "cabinet_select_own" on public.cabinets
  for select using (id = public.current_cabinet_id());

drop policy if exists "cabinet_update_admin" on public.cabinets;
create policy "cabinet_update_admin" on public.cabinets
  for update using (
    id = public.current_cabinet_id()
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- PROFILES : on voit / gère les profils de son propre cabinet
drop policy if exists "profile_select_own_cabinet" on public.profiles;
create policy "profile_select_own_cabinet" on public.profiles
  for select using (
    id = auth.uid() or cabinet_id = public.current_cabinet_id()
  );

drop policy if exists "profile_update_self" on public.profiles;
create policy "profile_update_self" on public.profiles
  for update using (id = auth.uid());
