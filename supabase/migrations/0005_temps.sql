-- =====================================================================
-- LexFlow — Module Temps (saisie du temps + taux horaires)
-- =====================================================================

-- Taux horaire par défaut de l'avocat, surchargeable par dossier
alter table public.profiles add column if not exists taux_horaire numeric(10, 2);
alter table public.dossiers add column if not exists taux_horaire numeric(10, 2);

create table if not exists public.time_entries (
  id            uuid primary key default gen_random_uuid(),
  cabinet_id    uuid not null default public.current_cabinet_id()
                  references public.cabinets (id) on delete cascade,
  dossier_id    uuid not null references public.dossiers (id) on delete cascade,
  avocat_id     uuid default auth.uid()
                  references public.profiles (id) on delete set null,
  date_saisie   date not null default current_date,
  duree_minutes integer not null check (duree_minutes > 0),
  -- Taux figé au moment de la saisie (intégrité de la facturation)
  taux          numeric(10, 2),
  description   text,
  -- Rattachement à une facture (rempli au module 4b)
  facture_id    uuid,
  facturee      boolean not null default false,
  created_at    timestamptz not null default now(),
  created_by    uuid default auth.uid() references auth.users (id) on delete set null
);

create index if not exists time_entries_cabinet_idx on public.time_entries (cabinet_id);
create index if not exists time_entries_dossier_idx on public.time_entries (dossier_id);

-- =====================================================================
-- RLS — isolation par cabinet
-- =====================================================================
alter table public.time_entries enable row level security;

drop policy if exists "time_entries_select" on public.time_entries;
create policy "time_entries_select" on public.time_entries
  for select using (cabinet_id = public.current_cabinet_id());

drop policy if exists "time_entries_insert" on public.time_entries;
create policy "time_entries_insert" on public.time_entries
  for insert with check (cabinet_id = public.current_cabinet_id());

drop policy if exists "time_entries_update" on public.time_entries;
create policy "time_entries_update" on public.time_entries
  for update using (cabinet_id = public.current_cabinet_id());

drop policy if exists "time_entries_delete" on public.time_entries;
create policy "time_entries_delete" on public.time_entries
  for delete using (cabinet_id = public.current_cabinet_id());
