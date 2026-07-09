import Stripe from "stripe";

// Initialisation paresseuse : on ne crée le client Stripe qu'à la première
// utilisation (runtime), pas à l'import. Évite de casser le build si
// STRIPE_SECRET_KEY n'est pas défini au moment de la collecte des pages.
let _stripe: Stripe | null = null;
function stripeClient(): Stripe {
  return (_stripe ??= new Stripe(process.env.STRIPE_SECRET_KEY!));
}

export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return Reflect.get(stripeClient(), prop);
  },
}) as Stripe;

export const TRIAL_DAYS = 14;

export const PLANS = {
  essentiel: {
    nom: "Essentiel",
    prix: 64,
    priceId: process.env.STRIPE_PRICE_ESSENTIEL!,
    features: ["Clients & dossiers", "Agenda & échéances", "Documents"],
  },
  cabinet: {
    nom: "Cabinet",
    prix: 129,
    priceId: process.env.STRIPE_PRICE_CABINET!,
    features: [
      "Tout Essentiel",
      "Temps & facturation",
      "Support prioritaire",
    ],
  },
} as const;

export type PlanCode = keyof typeof PLANS;

export function planFromPriceId(priceId: string | undefined): PlanCode | null {
  if (!priceId) return null;
  for (const [code, p] of Object.entries(PLANS)) {
    if (p.priceId === priceId) return code as PlanCode;
  }
  return null;
}

export const STATUT_LABELS: Record<string, string> = {
  inactif: "Inactif",
  trialing: "Période d'essai",
  active: "Actif",
  past_due: "Paiement en retard",
  canceled: "Annulé",
  unpaid: "Impayé",
};
