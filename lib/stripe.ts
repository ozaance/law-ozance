import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export const TRIAL_DAYS = 14;

export const PLANS = {
  essentiel: {
    nom: "Essentiel",
    prix: 49,
    priceId: process.env.STRIPE_PRICE_ESSENTIEL!,
    features: ["Clients & dossiers", "Agenda & échéances", "Documents"],
  },
  cabinet: {
    nom: "Cabinet",
    prix: 99,
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
