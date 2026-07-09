"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { requireCabinet } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";
import { encryptToken } from "@/lib/connectors/crypto";
import { CREDIT_PACKS } from "./constants";

async function baseUrl() {
  const h = await headers();
  const host = h.get("host")!;
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

// --- Achat de crédits IA (paiement unique Stripe) ---
export async function buyCredits(cents: number): Promise<void> {
  const user = await requireCabinet();
  if (user.role !== "admin")
    throw new Error("Seul un administrateur peut recharger les crédits.");
  if (!CREDIT_PACKS.includes(cents as (typeof CREDIT_PACKS)[number])) {
    throw new Error("Montant invalide.");
  }

  const supabase = await createClient();
  const { data: cabinet } = await supabase
    .from("cabinets")
    .select("stripe_customer_id")
    .eq("id", user.cabinetId)
    .single();

  let customerId = cabinet?.stripe_customer_id ?? null;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      name: user.cabinetNom,
      metadata: { cabinet_id: user.cabinetId },
    });
    customerId = customer.id;
    await supabase
      .from("cabinets")
      .update({ stripe_customer_id: customerId })
      .eq("id", user.cabinetId);
  }

  const base = await baseUrl();
  const euros = (cents / 100).toFixed(0);
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer: customerId,
    line_items: [
      {
        price_data: {
          currency: "eur",
          product_data: { name: `Crédits IA LexFlow — ${euros} €` },
          unit_amount: cents,
        },
        quantity: 1,
      },
    ],
    // Lu par le webhook pour créditer le portefeuille du cabinet.
    metadata: { cabinet_id: user.cabinetId, credit_cents: String(cents) },
    success_url: `${base}/parametres/credits?recharge=ok`,
    cancel_url: `${base}/parametres/credits`,
  });

  if (!session.url) throw new Error("Échec de la session de paiement.");
  redirect(session.url);
}

// Wrapper utilisable comme `action` de formulaire (bouton par pack).
export async function buyCreditsAction(formData: FormData): Promise<void> {
  await buyCredits(Number(formData.get("cents")));
}

export type ByokState = { error?: string; message?: string };

// --- Activer une clé Anthropic propre au cabinet (BYOK) ---
export async function saveByokKey(
  _prev: ByokState,
  formData: FormData,
): Promise<ByokState> {
  const user = await requireCabinet();
  if (user.role !== "admin")
    return { error: "Réservé aux administrateurs du cabinet." };

  const key = String(formData.get("key") ?? "").trim();
  if (!key.startsWith("sk-ant-"))
    return { error: "Clé Anthropic invalide (doit commencer par sk-ant-)." };

  const supabase = await createClient();
  const { error } = await supabase.from("ai_wallets").upsert(
    {
      cabinet_id: user.cabinetId,
      byok_enabled: true,
      byok_key_enc: encryptToken(key),
    },
    { onConflict: "cabinet_id" },
  );
  if (error) return { error: error.message };

  revalidatePath("/parametres/credits");
  return { message: "Clé du cabinet activée. Anthropic vous facturera directement." };
}

// --- Désactiver la clé propre (revenir aux crédits plateforme) ---
export async function disableByok(
  _prev: ByokState,
  _formData: FormData,
): Promise<ByokState> {
  const user = await requireCabinet();
  if (user.role !== "admin")
    return { error: "Réservé aux administrateurs du cabinet." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("ai_wallets")
    .update({ byok_enabled: false, byok_key_enc: null })
    .eq("cabinet_id", user.cabinetId);
  if (error) return { error: error.message };

  revalidatePath("/parametres/credits");
  return { message: "Clé désactivée. Le cabinet utilise à nouveau les crédits." };
}
