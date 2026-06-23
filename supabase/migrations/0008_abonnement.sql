-- =====================================================================
-- LexFlow — Abonnement Stripe (cabinet -> LexFlow)
-- =====================================================================

alter table public.cabinets
  add column if not exists stripe_customer_id     text,
  add column if not exists stripe_subscription_id text,
  add column if not exists abonnement_statut      text not null default 'inactif',
  add column if not exists abonnement_plan         text,
  add column if not exists abonnement_fin          timestamptz;

-- Les policies RLS de cabinets existent déjà :
--  - select : membres du cabinet
--  - update : admin du cabinet (suffit pour l'app après Checkout)
-- Le webhook Stripe (sans session utilisateur) utilisera la service_role key.
