import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { creditWallet } from "@/lib/ai/billing";

// Webhook Stripe — met à jour l'abonnement du cabinet sans session utilisateur.
// Nécessite STRIPE_WEBHOOK_SECRET + SUPABASE_SERVICE_ROLE_KEY.
// En local : stripe listen --forward-to localhost:3000/stripe/webhook
export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "webhook non configuré" }, { status: 501 });
  }

  const body = await request.text();
  const sig = request.headers.get("stripe-signature") ?? "";

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch (err) {
    return NextResponse.json(
      { error: `Signature invalide: ${(err as Error).message}` },
      { status: 400 },
    );
  }

  const admin = createAdminClient();

  async function syncSubscription(sub: Stripe.Subscription) {
    const customerId =
      typeof sub.customer === "string" ? sub.customer : sub.customer.id;
    const item = sub.items.data[0];
    await admin
      .from("cabinets")
      .update({
        stripe_subscription_id: sub.id,
        abonnement_statut: sub.status,
        abonnement_plan: item?.price.id ?? null,
        abonnement_fin: item
          ? new Date(item.current_period_end * 1000).toISOString()
          : null,
      })
      .eq("stripe_customer_id", customerId);
  }

  switch (event.type) {
    // Recharge de crédits IA (paiement unique). La session porte les
    // métadonnées cabinet_id + credit_cents posées à la création du Checkout.
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const cabinetId = session.metadata?.cabinet_id;
      const creditCents = Number(session.metadata?.credit_cents ?? 0);
      if (
        session.mode === "payment" &&
        session.payment_status === "paid" &&
        cabinetId &&
        creditCents > 0
      ) {
        await creditWallet(cabinetId, creditCents);
      }
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
      await syncSubscription(event.data.object as Stripe.Subscription);
      break;
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId =
        typeof sub.customer === "string" ? sub.customer : sub.customer.id;
      await admin
        .from("cabinets")
        .update({ abonnement_statut: "canceled" })
        .eq("stripe_customer_id", customerId);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
