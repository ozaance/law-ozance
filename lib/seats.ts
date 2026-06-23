import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

// Statuts d'abonnement pour lesquels on ajuste la quantité (sièges).
const BILLABLE = new Set(["active", "trialing", "past_due"]);

// Compte les membres effectifs d'un cabinet (un membre = un siège).
export async function countMembers(cabinetId: string): Promise<number> {
  const admin = createAdminClient();
  const { count } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("cabinet_id", cabinetId);
  return Math.max(1, count ?? 1);
}

// Aligne la quantité de l'abonnement Stripe sur le nombre de membres.
// Sans abonnement actif, ne fait rien (la quantité sera fixée au Checkout).
// Best-effort : une erreur de facturation ne doit pas casser le flux métier.
export async function syncSeats(cabinetId: string): Promise<void> {
  try {
    const admin = createAdminClient();
    const { data: cab } = await admin
      .from("cabinets")
      .select("stripe_subscription_id, abonnement_statut")
      .eq("id", cabinetId)
      .single();

    const subId = cab?.stripe_subscription_id;
    if (!subId || !BILLABLE.has(cab?.abonnement_statut ?? "")) return;

    const seats = await countMembers(cabinetId);
    const sub = await stripe.subscriptions.retrieve(subId);
    const item = sub.items.data[0];
    if (!item || item.quantity === seats) return;

    await stripe.subscriptions.update(subId, {
      items: [{ id: item.id, quantity: seats }],
      proration_behavior: "create_prorations",
    });
  } catch (err) {
    console.error("syncSeats failed", cabinetId, err);
  }
}
