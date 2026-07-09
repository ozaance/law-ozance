-- =====================================================================
-- 0022 — Crédit de bienvenue IA (2 €)
-- Chaque cabinet reçoit un petit crédit à la création de son portefeuille,
-- pour essayer l'assistant sans recharger. Offert une seule fois.
-- =====================================================================

-- Nouveau portefeuille (autres chemins de création éventuels) : défaut 200 c.
alter table public.ai_wallets alter column balance_cents set default 200;

-- Rétroactif : cabinets déjà dotés d'un portefeuille mais jamais rechargés
-- ni ayant consommé (solde à 0, hors BYOK) — on leur offre le crédit.
update public.ai_wallets w
  set balance_cents = 200, updated_at = now()
  where w.balance_cents = 0
    and w.byok_enabled = false
    and not exists (
      select 1 from public.ai_usage u where u.cabinet_id = w.cabinet_id
    );
