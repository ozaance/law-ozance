import { createAdminClient } from "@/lib/supabase/admin";
import { decryptToken } from "@/lib/connectors/crypto";

// =====================================================================
// Facturation de l'assistant IA (crédits prépayés + BYOK par cabinet).
// Écrit via le client service-role (route serveur), scopé manuellement
// par cabinet_id.
// =====================================================================

// Tarifs Anthropic (USD / 1M tokens) + conversion et marge revendeur.
const PRICE: Record<string, { inPerM: number; outPerM: number }> = {
  "claude-opus-4-8": { inPerM: 5, outPerM: 25 },
};
const USD_TO_EUR = 0.95;
const MARKUP = 1.6; // marge appliquée au coût Anthropic

// Coût facturé à l'utilisateur, en centimes d'euro (minimum 1 centime).
export function computeCostCents(
  model: string,
  inputTokens: number,
  outputTokens: number,
): number {
  const p = PRICE[model] ?? PRICE["claude-opus-4-8"];
  const usd =
    (inputTokens / 1_000_000) * p.inPerM +
    (outputTokens / 1_000_000) * p.outPerM;
  const cents = usd * USD_TO_EUR * MARKUP * 100;
  return Math.max(1, Math.ceil(cents));
}

export type Wallet = {
  cabinet_id: string;
  balance_cents: number;
  byok_enabled: boolean;
  byok_key_enc: string | null;
};

// Récupère (ou crée) le portefeuille du cabinet.
export async function getWallet(cabinetId: string): Promise<Wallet> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("ai_wallets")
    .select("cabinet_id, balance_cents, byok_enabled, byok_key_enc")
    .eq("cabinet_id", cabinetId)
    .maybeSingle();
  if (data) return data as Wallet;

  const { data: created } = await admin
    .from("ai_wallets")
    .insert({ cabinet_id: cabinetId })
    .select("cabinet_id, balance_cents, byok_enabled, byok_key_enc")
    .single();
  return (
    (created as Wallet | null) ?? {
      cabinet_id: cabinetId,
      balance_cents: 0,
      byok_enabled: false,
      byok_key_enc: null,
    }
  );
}

// Renvoie la clé Anthropic à utiliser : celle du cabinet (BYOK) si activée
// et présente, sinon null (⇒ utiliser la clé de la plateforme + crédits).
export function resolveByokKey(wallet: Wallet): string | null {
  if (!wallet.byok_enabled || !wallet.byok_key_enc) return null;
  try {
    return decryptToken(wallet.byok_key_enc);
  } catch {
    return null;
  }
}

// Journalise l'usage et débite les crédits (sauf en BYOK).
export async function debitAndLog(opts: {
  cabinetId: string;
  userId: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  byok: boolean;
}): Promise<{ costCents: number; balanceCents: number | null }> {
  const { cabinetId, userId, model, inputTokens, outputTokens, byok } = opts;
  const admin = createAdminClient();
  const costCents = byok ? 0 : computeCostCents(model, inputTokens, outputTokens);

  await admin.from("ai_usage").insert({
    cabinet_id: cabinetId,
    user_id: userId,
    model,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    cost_cents: costCents,
    byok,
  });

  if (byok || costCents === 0) return { costCents, balanceCents: null };

  // Débit atomique du solde
  const wallet = await getWallet(cabinetId);
  const newBalance = wallet.balance_cents - costCents;
  await admin
    .from("ai_wallets")
    .update({ balance_cents: newBalance, updated_at: new Date().toISOString() })
    .eq("cabinet_id", cabinetId);
  return { costCents, balanceCents: newBalance };
}

// Crédite le portefeuille (retour de paiement Stripe). Idempotence gérée
// en amont par l'appelant (webhook, par session Stripe).
export async function creditWallet(
  cabinetId: string,
  cents: number,
): Promise<void> {
  const admin = createAdminClient();
  const wallet = await getWallet(cabinetId);
  await admin
    .from("ai_wallets")
    .update({
      balance_cents: wallet.balance_cents + cents,
      updated_at: new Date().toISOString(),
    })
    .eq("cabinet_id", cabinetId);
}
