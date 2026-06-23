export function formatEuros(montant: number | null | undefined): string {
  if (montant == null) return "—";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(montant);
}

// Minutes -> "1h30" / "45min"
export function formatDuree(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h${String(m).padStart(2, "0")}`;
}

// Heures décimales (ex. 1.5) -> minutes (90)
export function heuresToMinutes(heures: number): number {
  return Math.round(heures * 60);
}

export function formatTaille(octets: number | null | undefined): string {
  if (octets == null) return "—";
  if (octets < 1024) return `${octets} o`;
  if (octets < 1024 * 1024) return `${(octets / 1024).toFixed(0)} Ko`;
  return `${(octets / (1024 * 1024)).toFixed(1)} Mo`;
}

export function montantLigne(
  dureeMinutes: number,
  taux: number | null,
): number | null {
  if (taux == null) return null;
  return Math.round((dureeMinutes / 60) * taux * 100) / 100;
}
