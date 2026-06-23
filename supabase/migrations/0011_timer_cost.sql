-- =====================================================================
-- 0011 — Chronomètre live + coût horaire (rentabilité collaborateurs)
-- =====================================================================

-- Coût horaire chargé du collaborateur (salaire + charges) pour la marge.
alter table public.profiles
  add column if not exists cout_horaire numeric(10, 2);

-- Chronomètre actif : au plus un par utilisateur.
create table if not exists public.active_timers (
  user_id     uuid primary key references public.profiles (id) on delete cascade,
  cabinet_id  uuid not null default public.current_cabinet_id()
                references public.cabinets (id) on delete cascade,
  dossier_id  uuid not null references public.dossiers (id) on delete cascade,
  description text,
  started_at  timestamptz not null default now()
);

alter table public.active_timers enable row level security;

-- Chacun ne gère que son propre chronomètre.
drop policy if exists "active_timers_all" on public.active_timers;
create policy "active_timers_all" on public.active_timers
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and cabinet_id = public.current_cabinet_id());

-- Définir le coût horaire d'un membre (admin du même cabinet uniquement).
create or replace function public.set_member_cost(p_member uuid, p_cost numeric)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  caller      uuid := auth.uid();
  caller_cab  uuid;
  caller_role public.role_cabinet;
  target_cab  uuid;
begin
  if caller is null then
    raise exception 'Authentification requise';
  end if;

  select cabinet_id, role into caller_cab, caller_role
  from public.profiles where id = caller;
  if caller_cab is null or caller_role <> 'admin' then
    raise exception 'Action réservée aux administrateurs';
  end if;

  select cabinet_id into target_cab from public.profiles where id = p_member;
  if target_cab is null or target_cab <> caller_cab then
    raise exception 'Membre introuvable';
  end if;

  update public.profiles set cout_horaire = p_cost where id = p_member;
end;
$$;

grant execute on function public.set_member_cost(uuid, numeric) to authenticated;
