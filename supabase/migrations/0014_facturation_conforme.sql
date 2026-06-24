-- =====================================================================
-- 0014 — Facturation conforme (mentions légales, TVA, numérotation)
-- =====================================================================

-- 1) Informations émetteur (sur le cabinet) ---------------------------
alter table public.cabinets
  add column if not exists adresse          text,
  add column if not exists code_postal      text,
  add column if not exists ville            text,
  add column if not exists forme_juridique  text,
  add column if not exists siret            text,
  add column if not exists tva_intra        text,
  add column if not exists iban             text,
  add column if not exists bic              text,
  add column if not exists tva_assujetti    boolean not null default true,
  add column if not exists tva_taux         numeric(5, 2) not null default 20,
  add column if not exists mentions_facture text;

-- 2) Adresse / TVA du client -----------------------------------------
alter table public.clients
  add column if not exists adresse     text,
  add column if not exists code_postal text,
  add column if not exists ville       text,
  add column if not exists tva_intra   text;

-- 3) Détail TVA sur la facture ---------------------------------------
-- `total` reste le TTC (compatibilité). On ajoute HT, taux et montant TVA.
alter table public.factures
  add column if not exists montant_ht  numeric(12, 2),
  add column if not exists taux_tva    numeric(5, 2),
  add column if not exists montant_tva numeric(12, 2);

-- 4) Numérotation séquentielle robuste (sans trou) -------------------
-- Compteur par cabinet et par année (incrément atomique).
create table if not exists public.facture_compteurs (
  cabinet_id uuid not null references public.cabinets (id) on delete cascade,
  annee      int  not null,
  dernier    int  not null default 0,
  primary key (cabinet_id, annee)
);
alter table public.facture_compteurs enable row level security;
-- Aucune policy : géré uniquement par la fonction SECURITY DEFINER ci-dessous.

-- On n'attribue plus le numéro à l'insertion (les brouillons restent sans
-- numéro pour éviter les trous si on en supprime). Suppression de l'ancien
-- trigger basé sur count(*).
drop trigger if exists set_facture_numero_trg on public.factures;
drop function if exists public.set_facture_numero();

-- Attribue (une seule fois) un numéro définitif à une facture.
create or replace function public.attribuer_numero_facture(p_facture uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  cab      uuid;
  yr       int;
  existing text;
  n        int;
begin
  select cabinet_id, numero,
         date_part('year', coalesce(date_emission, current_date))::int
    into cab, existing, yr
  from public.factures where id = p_facture;

  if cab is null then
    raise exception 'Facture introuvable';
  end if;
  if cab <> public.current_cabinet_id() then
    raise exception 'Accès refusé';
  end if;
  if existing is not null and existing <> '' then
    return existing; -- déjà numérotée : on ne renumérote jamais
  end if;

  insert into public.facture_compteurs (cabinet_id, annee, dernier)
    values (cab, yr, 1)
  on conflict (cabinet_id, annee)
    do update set dernier = public.facture_compteurs.dernier + 1
  returning dernier into n;

  update public.factures
    set numero = 'FAC-' || yr::text || '-' || lpad(n::text, 4, '0')
    where id = p_facture;

  return 'FAC-' || yr::text || '-' || lpad(n::text, 4, '0');
end;
$$;

grant execute on function public.attribuer_numero_facture(uuid) to authenticated;
