-- =====================================================================
-- 0015 — Notes d'honoraires : forfait/lignes libres + identité avocat
-- =====================================================================

-- 1) Identité de l'avocat (en-tête de la note d'honoraires) -----------
alter table public.cabinets
  add column if not exists barreau              text,
  add column if not exists telephone            text,
  add column if not exists site_web             text,
  add column if not exists logo_url             text,
  add column if not exists conditions_reglement text;

-- 2) Champs note d'honoraires sur la facture -------------------------
alter table public.factures
  add column if not exists objet              text,
  add column if not exists type_document      text not null default 'note',
  add column if not exists honoraire_resultat text;

-- 3) Lignes libres (forfait : désignation + montant) -----------------
create table if not exists public.facture_lignes (
  id          uuid primary key default gen_random_uuid(),
  cabinet_id  uuid not null default public.current_cabinet_id()
                references public.cabinets (id) on delete cascade,
  facture_id  uuid not null references public.factures (id) on delete cascade,
  designation text not null,
  montant     numeric(12, 2) not null default 0,
  ordre       int not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists facture_lignes_facture_idx
  on public.facture_lignes (facture_id);

alter table public.facture_lignes enable row level security;

drop policy if exists "facture_lignes_select" on public.facture_lignes;
create policy "facture_lignes_select" on public.facture_lignes
  for select using (cabinet_id = public.current_cabinet_id());

drop policy if exists "facture_lignes_insert" on public.facture_lignes;
create policy "facture_lignes_insert" on public.facture_lignes
  for insert with check (cabinet_id = public.current_cabinet_id());

drop policy if exists "facture_lignes_update" on public.facture_lignes;
create policy "facture_lignes_update" on public.facture_lignes
  for update using (cabinet_id = public.current_cabinet_id());

drop policy if exists "facture_lignes_delete" on public.facture_lignes;
create policy "facture_lignes_delete" on public.facture_lignes
  for delete using (cabinet_id = public.current_cabinet_id());

-- 4) Numérotation au format AAAA/MM/NNNN (séquence annuelle continue) -
create or replace function public.attribuer_numero_facture(p_facture uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  cab      uuid;
  emission date;
  yr       int;
  mois     text;
  existing text;
  n        int;
  num      text;
begin
  select cabinet_id, numero, coalesce(date_emission, current_date)
    into cab, existing, emission
  from public.factures where id = p_facture;

  if cab is null then
    raise exception 'Facture introuvable';
  end if;
  if cab <> public.current_cabinet_id() then
    raise exception 'Accès refusé';
  end if;
  if existing is not null and existing <> '' then
    return existing;
  end if;

  yr := date_part('year', emission)::int;
  mois := lpad(date_part('month', emission)::int::text, 2, '0');

  insert into public.facture_compteurs (cabinet_id, annee, dernier)
    values (cab, yr, 1)
  on conflict (cabinet_id, annee)
    do update set dernier = public.facture_compteurs.dernier + 1
  returning dernier into n;

  num := yr::text || '/' || mois || '/' || lpad(n::text, 4, '0');
  update public.factures set numero = num where id = p_facture;
  return num;
end;
$$;

grant execute on function public.attribuer_numero_facture(uuid) to authenticated;
