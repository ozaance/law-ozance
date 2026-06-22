export const TYPES_AFFAIRE = {
  conseil: "Conseil",
  contrat: "Contrat commercial",
  ma: "Fusion-acquisition (M&A)",
  contentieux: "Contentieux",
  corporate: "Corporate / sociétés",
  social: "Droit social",
  fiscal: "Fiscal",
  recouvrement: "Recouvrement",
  autre: "Autre",
} as const;

export const STATUTS = {
  ouvert: "Ouvert",
  en_cours: "En cours",
  en_attente: "En attente",
  clos: "Clos",
} as const;

export const STATUT_COLORS: Record<keyof typeof STATUTS, string> = {
  ouvert: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  en_cours: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  en_attente: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  clos: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
};

export type TypeAffaire = keyof typeof TYPES_AFFAIRE;
export type Statut = keyof typeof STATUTS;
