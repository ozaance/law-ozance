-- =====================================================================
-- 0021 — Crédits IA (prépayés) + clé Anthropic propre (BYOK) par cabinet
-- Chaque cabinet dispose d'un portefeuille de crédits (centimes d'euro).
-- La consommation de l'assistant IA débite ce solde, SAUF si le cabinet
-- a activé sa propre clé Anthropic (BYOK) : dans ce cas Anthropic le
-- facture directement et aucun crédit n'est débité.
--
-- Solde et journalisation sont écrits côté serveur (client service-role :
-- route de l'assistant + webhook Stripe). La RLS ci-dessous ne sert qu'à
-- la lecture par les membres et à la config BYOK par l'admin.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Portefeuille IA — un par cabinet
-- ---------------------------------------------------------------------
create table if not exists public.ai_wallets (
  cabinet_id     uuid primary key
                   references public.cabinets (id) on delete cascade,
  -- Solde prépayé en centimes d'euro
  balance_cents  integer not null default 0,
  -- Clé Anthropic propre au cabinet (chiffrée AES-256-GCM), optionnelle
  byok_enabled   boolean not null default false,
  byok_key_enc   text,
  updated_at     timestamptz not null default now()
);

alter table public.ai_wallets enable row level security;

-- Lecture : tous les membres du cabinet voient le solde
drop policy if exists "ai_wallets_select" on public.ai_wallets;
create policy "ai_wallets_select" on public.ai_wallets
  for select using (cabinet_id = public.current_cabinet_id());

-- Écriture directe (config BYOK) : admin uniquement. Le solde lui-même
-- est modifié via le client service-role (route/webhook), hors RLS.
drop policy if exists "ai_wallets_admin_write" on public.ai_wallets;
create policy "ai_wallets_admin_write" on public.ai_wallets
  for all using (
    cabinet_id = public.current_cabinet_id()
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  )
  with check (cabinet_id = public.current_cabinet_id());

-- ---------------------------------------------------------------------
-- Journal d'usage IA (une ligne par échange assistant)
-- ---------------------------------------------------------------------
create table if not exists public.ai_usage (
  id             uuid primary key default gen_random_uuid(),
  cabinet_id     uuid not null references public.cabinets (id) on delete cascade,
  user_id        uuid references auth.users (id) on delete set null,
  model          text not null,
  input_tokens   integer not null default 0,
  output_tokens  integer not null default 0,
  cost_cents     integer not null default 0,
  byok           boolean not null default false,
  created_at     timestamptz not null default now()
);

create index if not exists ai_usage_cabinet_idx on public.ai_usage (cabinet_id);
create index if not exists ai_usage_created_idx on public.ai_usage (created_at);

alter table public.ai_usage enable row level security;

-- Lecture : membres du cabinet (transparence sur la consommation)
drop policy if exists "ai_usage_select" on public.ai_usage;
create policy "ai_usage_select" on public.ai_usage
  for select using (cabinet_id = public.current_cabinet_id());
-- Écriture : uniquement côté serveur (service-role), pas de policy insert.
