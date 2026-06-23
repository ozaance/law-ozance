"use client";

import { useTransition } from "react";
import { updateStatutFacture } from "../actions";
import { STATUTS_FACTURE } from "../constants";

export function StatutControl({
  id,
  statut,
}: {
  id: string;
  statut: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <select
      defaultValue={statut}
      disabled={pending}
      onChange={(e) =>
        startTransition(() => updateStatutFacture(id, e.target.value))
      }
      className="rounded-md border border-border-strong bg-white px-3 py-1.5 text-sm outline-none focus:border-zinc-900 disabled:opacity-50 dark:border-border-strong dark:bg-zinc-900"
    >
      {Object.entries(STATUTS_FACTURE).map(([v, label]) => (
        <option key={v} value={v}>
          {label}
        </option>
      ))}
    </select>
  );
}
