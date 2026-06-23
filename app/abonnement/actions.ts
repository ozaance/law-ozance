"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { requireCabinet } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { stripe, PLANS, TRIAL_DAYS, type PlanCode } from "@/lib/stripe";

async function baseUrl() {
  const h = await headers();
  const host = h.get("host")!;
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

export async function createCheckoutSession(plan: PlanCode) {
  const user = await requireCabinet();
  const supabase = await createClient();

  const { data: cabinet } = await supabase
    .from("cabinets")
    .select("stripe_customer_id")
    .eq("id", user.cabinetId)
    .single();

  // Client Stripe : réutilise ou crée
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
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: PLANS[plan].priceId, quantity: 1 }],
    subscription_data: {
      trial_period_days: TRIAL_DAYS,
      metadata: { cabinet_id: user.cabinetId },
    },
    success_url: `${base}/abonnement?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${base}/abonnement`,
  });

  if (!session.url) throw new Error("Échec de création de la session Checkout.");
  redirect(session.url);
}

// Synchronise l'abonnement du cabinet depuis une session Checkout (retour de paiement).
export async function syncFromSession(sessionId: string) {
  const user = await requireCabinet();
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["subscription"],
  });
  const sub = session.subscription as import("stripe").Stripe.Subscription | null;
  if (!sub) return;

  const item = sub.items.data[0];
  const supabase = await createClient();
  await supabase
    .from("cabinets")
    .update({
      stripe_subscription_id: sub.id,
      abonnement_statut: sub.status,
      abonnement_plan: item?.price.id ?? null,
      abonnement_fin: item
        ? new Date(item.current_period_end * 1000).toISOString()
        : null,
    })
    .eq("id", user.cabinetId);
}

// Portail de facturation Stripe (gérer / annuler).
export async function openBillingPortal() {
  const user = await requireCabinet();
  const supabase = await createClient();
  const { data: cabinet } = await supabase
    .from("cabinets")
    .select("stripe_customer_id")
    .eq("id", user.cabinetId)
    .single();

  if (!cabinet?.stripe_customer_id) redirect("/abonnement");

  const base = await baseUrl();
  const portal = await stripe.billingPortal.sessions.create({
    customer: cabinet.stripe_customer_id,
    return_url: `${base}/abonnement`,
  });
  redirect(portal.url);
}
