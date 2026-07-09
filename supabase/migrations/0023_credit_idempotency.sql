-- =====================================================================
-- 0023 — Idempotence des recharges de crédits IA
-- Le webhook Stripe peut livrer le même événement plusieurs fois. On lie
-- l'idempotence à la SESSION Stripe (l'argent), pas à la livraison :
-- un registre unique par session + un crédit atomique dans la même
-- transaction garantissent « exactement une fois ».
-- =====================================================================

create table if not exists public.ai_credit_topups (
  id                 uuid primary key default gen_random_uuid(),
  cabinet_id         uuid not null references public.cabinets (id) on delete cascade,
  -- Identifiant de la session Checkout Stripe : garantit l'unicité du crédit
  stripe_session_id  text not null unique,
  cents              integer not null,
  created_at         timestamptz not null default now()
);

create index if not exists ai_credit_topups_cabinet_idx
  on public.ai_credit_topups (cabinet_id);

alter table public.ai_credit_topups enable row level security;

-- Lecture (audit) par les membres du cabinet ; écriture réservée au serveur.
drop policy if exists "ai_credit_topups_select" on public.ai_credit_topups;
create policy "ai_credit_topups_select" on public.ai_credit_topups
  for select using (cabinet_id = public.current_cabinet_id());

-- ---------------------------------------------------------------------
-- Crédit atomique et idempotent : enregistre la session puis crédite le
-- portefeuille dans la même transaction. Renvoie false si la session a
-- déjà été traitée (livraison webhook en double).
-- ---------------------------------------------------------------------
create or replace function public.record_credit_topup(
  p_cabinet uuid,
  p_session text,
  p_cents   integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.ai_credit_topups (cabinet_id, stripe_session_id, cents)
  values (p_cabinet, p_session, p_cents)
  on conflict (stripe_session_id) do nothing;

  if not found then
    return false; -- déjà crédité pour cette session
  end if;

  -- Le portefeuille existe (avec crédit de bienvenue) ou est créé ici.
  insert into public.ai_wallets (cabinet_id)
  values (p_cabinet)
  on conflict (cabinet_id) do nothing;

  update public.ai_wallets
    set balance_cents = balance_cents + p_cents, updated_at = now()
    where cabinet_id = p_cabinet;

  return true;
end;
$$;

grant execute on function public.record_credit_topup(uuid, text, integer)
  to service_role;
