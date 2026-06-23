-- =====================================================================
-- 0009 — Invitations d'équipe
-- Permettre à un cabinet (admin) d'inviter des collaborateurs (avocat/assistant)
-- via un lien d'invitation à usage unique.
-- =====================================================================

-- Helper : l'utilisateur courant est-il admin de son cabinet ?
-- SECURITY DEFINER => pas de récursion RLS lors des checks dans les policies.
create or replace function public.is_cabinet_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create table if not exists public.invitations (
  id          uuid primary key default gen_random_uuid(),
  cabinet_id  uuid not null references public.cabinets (id) on delete cascade,
  email       text not null,
  role        public.role_cabinet not null default 'avocat',
  token       text not null unique,
  status      text not null default 'pending'
              check (status in ('pending', 'accepted', 'revoked')),
  invited_by  uuid references auth.users (id) on delete set null,
  accepted_by uuid references auth.users (id) on delete set null,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null default (now() + interval '14 days'),
  accepted_at timestamptz
);

create index if not exists invitations_cabinet_idx on public.invitations (cabinet_id);

-- Une seule invitation "en attente" par adresse et par cabinet.
create unique index if not exists invitations_pending_unique
  on public.invitations (cabinet_id, lower(email))
  where status = 'pending';

alter table public.invitations enable row level security;

-- Lecture : les membres du cabinet voient les invitations de leur cabinet.
drop policy if exists "inv_select_cabinet" on public.invitations;
create policy "inv_select_cabinet" on public.invitations
  for select using (cabinet_id = public.current_cabinet_id());

-- Création : réservée aux admins, sur leur propre cabinet.
drop policy if exists "inv_insert_admin" on public.invitations;
create policy "inv_insert_admin" on public.invitations
  for insert with check (
    cabinet_id = public.current_cabinet_id() and public.is_cabinet_admin()
  );

-- Mise à jour (révocation) : réservée aux admins, sur leur propre cabinet.
drop policy if exists "inv_update_admin" on public.invitations;
create policy "inv_update_admin" on public.invitations
  for update using (
    cabinet_id = public.current_cabinet_id() and public.is_cabinet_admin()
  );

-- Détails d'une invitation (par token) pour la page publique d'acceptation.
create or replace function public.get_invitation(p_token text)
returns table (
  cabinet_nom text,
  email       text,
  role        public.role_cabinet,
  status      text,
  expired     boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select c.nom, i.email, i.role, i.status, (i.expires_at < now())
  from public.invitations i
  join public.cabinets c on c.id = i.cabinet_id
  where i.token = p_token;
$$;

grant execute on function public.get_invitation(text) to anon, authenticated;

-- Acceptation : rattache l'utilisateur courant au cabinet, avec le rôle prévu.
create or replace function public.accept_invitation(p_token text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  inv    public.invitations%rowtype;
  uid    uuid := auth.uid();
  uemail text;
begin
  if uid is null then
    raise exception 'Authentification requise';
  end if;

  select * into inv from public.invitations where token = p_token for update;
  if not found then
    raise exception 'Invitation introuvable';
  end if;
  if inv.status <> 'pending' then
    raise exception 'Cette invitation n''est plus valable';
  end if;
  if inv.expires_at < now() then
    raise exception 'Cette invitation a expiré';
  end if;

  select email into uemail from public.profiles where id = uid;
  if lower(coalesce(uemail, '')) <> lower(inv.email) then
    raise exception 'Cette invitation est destinée à une autre adresse email';
  end if;

  if (select cabinet_id from public.profiles where id = uid) is not null then
    raise exception 'Vous appartenez déjà à un cabinet';
  end if;

  update public.profiles
    set cabinet_id = inv.cabinet_id, role = inv.role
    where id = uid;

  update public.invitations
    set status = 'accepted', accepted_by = uid, accepted_at = now()
    where id = inv.id;

  return inv.cabinet_id;
end;
$$;

grant execute on function public.accept_invitation(text) to authenticated;
revoke execute on function public.accept_invitation(text) from anon;
