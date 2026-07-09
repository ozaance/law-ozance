// Crée (idempotent) les produits + prix LexFlow sur Stripe.
// Usage : set -a; source .env.local; set +a; node scripts/stripe-setup.mjs
import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error("STRIPE_SECRET_KEY manquant.");
  process.exit(1);
}
const stripe = new Stripe(key);

const PLANS = [
  { code: "essentiel", nom: "LexFlow Essentiel", montant: 6400 },
  { code: "cabinet", nom: "LexFlow Cabinet", montant: 12900 },
];

async function ensurePlan({ code, nom, montant }) {
  // Cherche un produit existant par metadata.lexflow_code
  const found = await stripe.products.search({
    query: `metadata['lexflow_code']:'${code}'`,
  });
  let product = found.data[0];
  if (!product) {
    product = await stripe.products.create({
      name: nom,
      metadata: { lexflow_code: code },
    });
  }

  // Réutilise un prix mensuel actif s'il existe
  const prices = await stripe.prices.list({ product: product.id, active: true });
  let price = prices.data.find(
    (p) => p.recurring?.interval === "month" && p.unit_amount === montant,
  );
  if (!price) {
    price = await stripe.prices.create({
      product: product.id,
      currency: "eur",
      unit_amount: montant,
      recurring: { interval: "month" },
    });
  }
  return { code, priceId: price.id, montant };
}

const results = [];
for (const plan of PLANS) results.push(await ensurePlan(plan));

console.log("\n=== Price IDs (à mettre dans .env.local) ===");
for (const r of results) {
  const envName = `STRIPE_PRICE_${r.code.toUpperCase()}`;
  console.log(`${envName}=${r.priceId}`);
}
