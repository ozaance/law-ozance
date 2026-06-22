export const TYPES_EVENEMENT = {
  echeance: "Échéance",
  rendez_vous: "Rendez-vous",
  audience: "Audience",
  tache: "Tâche",
} as const;

export const TYPE_COLORS: Record<keyof typeof TYPES_EVENEMENT, string> = {
  echeance: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
  rendez_vous: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  audience: "bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
  tache: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
};

export type TypeEvenement = keyof typeof TYPES_EVENEMENT;

export function formatDateFr(date: string): string {
  return new Date(date + "T00:00:00").toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
