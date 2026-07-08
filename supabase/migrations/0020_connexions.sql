-- =====================================================================
-- 0020 — Connecteurs (OAuth) + jetons MCP
-- Permet de relier des comptes tiers (Google Workspace, Microsoft 365,
-- compta, stockage/signature) au compte LexFlow, et d'exposer les
-- données du cabinet à un assistant IA via le protocole MCP.
--
-- Sécurité : les jetons OAuth (access/refresh) sont chiffrés côté
-- application (AES-256-GCM, cf. lib/connectors/crypto.ts) avant d'être
-- stockés ici. Les jetons MCP ne sont jamais stockés en clair : seul
-- leur hash SHA-256 est conservé.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Connexions OAuth (une par utilisateur × fournisseur × compte distant)
-- ---------------------------------------------------------------------
create table if not exists public.connexions (
  id                  uuid primary key default gen_random_uuid(),
  cabinet_id          uuid not null default public.current_cabinet_id()
                        references public.cabinets (id) on delete cascade,
  user_id             uuid not null default auth.uid()
                        references auth.users (id) on delete cascade,
  -- Identifiant du fournisseur, cf. lib/connectors/registry.ts
  provider            text not null,
  -- connected | expired | error
  status              text not null default 'connected',
  -- Identité du compte distant relié (pour l'affichage)
  account_email       text,
  account_label       text,
  external_account_id text,
  scopes              text[] not null default '{}',
  -- Jetons chiffrés (AES-256-GCM) — jamais en clair
  access_token        text,
  refresh_token       text,
  token_expires_at    timestamptz,
  error_message       text,
  metadata            jsonb not null default '{}',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (cabinet_id, user_id, provider, account_email)
);

create index if not exists connexions_cabinet_idx on public.connexions (cabinet_id);
create index if not exists connexions_user_idx on public.connexions (user_id);

-- RLS — chacun ne voit et ne gère que SES propres connexions
alter table public.connexions enable row level security;

drop policy if exists "connexions_select" on public.connexions;
create policy "connexions_select" on public.connexions
  for select using (
    cabinet_id = public.current_cabinet_id() and user_id = auth.uid()
  );

drop policy if exists "connexions_insert" on public.connexions;
create policy "connexions_insert" on public.connexions
  for insert with check (
    cabinet_id = public.current_cabinet_id() and user_id = auth.uid()
  );

drop policy if exists "connexions_update" on public.connexions;
create policy "connexions_update" on public.connexions
  for update using (
    cabinet_id = public.current_cabinet_id() and user_id = auth.uid()
  );

drop policy if exists "connexions_delete" on public.connexions;
create policy "connexions_delete" on public.connexions
  for delete using (
    cabinet_id = public.current_cabinet_id() and user_id = auth.uid()
  );

-- ---------------------------------------------------------------------
-- Jetons MCP (un assistant IA s'authentifie avec, pour lire les
-- données du cabinet). Portée : tout le cabinet, créés par un admin.
-- ---------------------------------------------------------------------
create table if not exists public.mcp_tokens (
  id            uuid primary key default gen_random_uuid(),
  cabinet_id    uuid not null default public.current_cabinet_id()
                  references public.cabinets (id) on delete cascade,
  created_by    uuid default auth.uid()
                  references auth.users (id) on delete set null,
  name          text not null default 'Jeton MCP',
  -- SHA-256 (hex) du jeton ; le jeton en clair n'est montré qu'une fois
  token_hash    text not null unique,
  -- Préfixe affichable pour reconnaître le jeton (ex. lxf_ab12…)
  token_prefix  text not null,
  last_used_at  timestamptz,
  revoked       boolean not null default false,
  created_at    timestamptz not null default now()
);

create index if not exists mcp_tokens_cabinet_idx on public.mcp_tokens (cabinet_id);
create index if not exists mcp_tokens_hash_idx on public.mcp_tokens (token_hash);

alter table public.mcp_tokens enable row level security;

-- Réservé aux admins du cabinet (les jetons donnent accès à tout le cabinet)
drop policy if exists "mcp_tokens_select" on public.mcp_tokens;
create policy "mcp_tokens_select" on public.mcp_tokens
  for select using (
    cabinet_id = public.current_cabinet_id()
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

drop policy if exists "mcp_tokens_insert" on public.mcp_tokens;
create policy "mcp_tokens_insert" on public.mcp_tokens
  for insert with check (
    cabinet_id = public.current_cabinet_id()
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

drop policy if exists "mcp_tokens_update" on public.mcp_tokens;
create policy "mcp_tokens_update" on public.mcp_tokens
  for update using (
    cabinet_id = public.current_cabinet_id()
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

drop policy if exists "mcp_tokens_delete" on public.mcp_tokens;
create policy "mcp_tokens_delete" on public.mcp_tokens
  for delete using (
    cabinet_id = public.current_cabinet_id()
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );
