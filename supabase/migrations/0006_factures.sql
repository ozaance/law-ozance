-- =====================================================================
-- LexFlow — Module Facturation (notes d'honoraires clients)
-- =====================================================================

do $$ begin
  create type public.facture_statut as enum (
    'brouillon', 'envoyee', 'payee', 'annulee'
  );
exception when duplicate_object then null;
end $$;

create table if not exists public.factures (
  id            uuid primary key default gen_random_uuid(),
  cabinet_id    uuid not null default public.current_cabinet_id()
                  references public.cabinets (id) on delete cascade,
  client_id     uuid not null references public.clients (id) on delete restrict,
  numero        text,
  statut        public.facture_statut not null default 'brouillon',
  date_emission date not null default current_date,
  date_echeance date,
  notes         text,
  total         numeric(12, 2) not null default 0,
  created_at    timestamptz not null default now(),
  created_by    uuid default auth.uid() references auth.users (id) on delete set null
);

create index if not exists factures_cabinet_idx on public.factures (cabinet_id);
create index if not exists factures_client_idx on public.factures (client_id);

-- Lien des saisies de temps vers la facture (colonne créée en 0005)
do $$ begin
  alter table public.time_entries
    add constraint time_entries_facture_id_fkey
    foreign key (facture_id) references public.factures (id) on delete set null;
exception when duplicate_object then null;
end $$;

-- Numéro auto : FAC-AAAA-NNN par cabinet et par année
create or replace function public.set_facture_numero()
returns trigger
language plpgsql
as $$
begin
  if new.numero is null or new.numero = '' then
    new.numero := 'FAC-' || to_char(now(), 'YYYY') || '-' || lpad((
      select count(*) + 1
      from public.factures f
      where f.cabinet_id = new.cabinet_id
        and date_part('year', f.created_at) = date_part('year', now())
    )::text, 3, '0');
  end if;
  return new;
end;
$$;

drop trigger if exists set_facture_numero_trg on public.factures;
create trigger set_facture_numero_trg
  before insert on public.factures
  for each row execute function public.set_facture_numero();

-- =====================================================================
-- RLS — isolation par cabinet
-- =====================================================================
alter table public.factures enable row level security;

drop policy if exists "factures_select" on public.factures;
create policy "factures_select" on public.factures
  for select using (cabinet_id = public.current_cabinet_id());

drop policy if exists "factures_insert" on public.factures;
create policy "factures_insert" on public.factures
  for insert with check (cabinet_id = public.current_cabinet_id());

drop policy if exists "factures_update" on public.factures;
create policy "factures_update" on public.factures
  for update using (cabinet_id = public.current_cabinet_id());

drop policy if exists "factures_delete" on public.factures;
create policy "factures_delete" on public.factures
  for delete using (cabinet_id = public.current_cabinet_id());
