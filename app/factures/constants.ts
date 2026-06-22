export const STATUTS_FACTURE = {
  brouillon: "Brouillon",
  envoyee: "Envoyée",
  payee: "Payée",
  annulee: "Annulée",
} as const;

export const STATUT_FACTURE_COLORS: Record<
  keyof typeof STATUTS_FACTURE,
  string
> = {
  brouillon: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
  envoyee: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  payee: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  annulee: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
};

export type StatutFacture = keyof typeof STATUTS_FACTURE;
