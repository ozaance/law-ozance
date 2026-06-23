// Teste le webhook Stripe de bout en bout SANS Stripe CLI ni déploiement :
// on signe un faux événement avec STRIPE_WEBHOOK_SECRET puis on vérifie la BDD.
// Usage : set -a; source .env.local; set +a; node scripts/test-webhook.mjs
import Stripe from "stripe";
import pg from "pg";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const secret = process.env.STRIPE_WEBHOOK_SECRET;

const db = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
await db.connect();

const { rows } = await db.query(
  `select id, nom, stripe_customer_id, abonnement_statut, abonnement_fin
     from public.cabinets where stripe_customer_id is not null limit 1`,
);
if (!rows.length) {
  console.error("Aucun cabinet avec stripe_customer_id (fais d'abord un Checkout).");
  process.exit(1);
}
const cab = rows[0];
console.log("Cabinet ciblé :", cab.nom, "(", cab.stripe_customer_id, ")");
console.log("AVANT  →", cab.abonnement_statut, "| fin:", cab.abonnement_fin);

const periodEnd = Math.floor(Date.now() / 1000) + 30 * 24 * 3600;
const event = {
  id: "evt_test_" + Date.now(),
  object: "event",
  type: "customer.subscription.updated",
  data: {
    object: {
      id: "sub_test_" + Date.now(),
      object: "subscription",
      customer: cab.stripe_customer_id,
      status: "active",
      items: {
        object: "list",
        data: [
          {
            id: "si_test",
            price: { id: process.env.STRIPE_PRICE_CABINET },
            current_period_end: periodEnd,
          },
        ],
      },
    },
  },
};

const payload = JSON.stringify(event);
const header = stripe.webhooks.generateTestHeaderString({ payload, secret });

const res = await fetch("http://localhost:3000/stripe/webhook", {
  method: "POST",
  headers: { "stripe-signature": header, "content-type": "application/json" },
  body: payload,
});
console.log("Réponse webhook :", res.status, await res.text());

const after = await db.query(
  `select abonnement_statut, abonnement_fin, stripe_subscription_id
     from public.cabinets where id = $1`,
  [cab.id],
);
console.log("APRÈS  →", after.rows[0].abonnement_statut, "| fin:", after.rows[0].abonnement_fin);
console.log("sub_id →", after.rows[0].stripe_subscription_id);

const ok =
  after.rows[0].abonnement_statut === "active" &&
  after.rows[0].stripe_subscription_id?.startsWith("sub_test_");
console.log(ok ? "\n✅ Webhook OK : la base a bien été mise à jour." : "\n❌ Pas de mise à jour.");
await db.end();
