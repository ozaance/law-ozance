"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { createFacture } from "../actions";
import { formatDuree, formatEuros } from "@/lib/format";

export type Ligne = {
  id: string;
  date: string;
  dureeMinutes: number;
  description: string;
  dossier: string;
  montant: number | null;
};

const inputCls =
  "rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-100";

export function FactureForm({
  clientId,
  lignes,
}: {
  clientId: string;
  lignes: Ligne[];
}) {
  const [state, action, pending] = useActionState(createFacture, {});
  const [checked, setChecked] = useState<Set<string>>(
    () => new Set(lignes.map((l) => l.id)),
  );

  const total = useMemo(
    () =>
      lignes
        .filter((l) => checked.has(l.id))
        .reduce((s, l) => s + (l.montant ?? 0), 0),
    [checked, lignes],
  );

  function toggle(id: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <form action={action} className="flex flex-col gap-6">
      <input type="hidden" name="client_id" value={clientId} />

      <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
        {lignes.map((l) => (
          <label
            key={l.id}
            className="flex cursor-pointer items-center gap-3 border-b border-zinc-200 px-4 py-2.5 text-sm last:border-0 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
          >
            <input
              type="checkbox"
              name="entries"
              value={l.id}
              checked={checked.has(l.id)}
              onChange={() => toggle(l.id)}
              className="h-4 w-4"
            />
            <span className="w-20 shrink-0 text-xs text-zinc-500">{l.date}</span>
            <span className="w-16 shrink-0 font-medium">
              {formatDuree(l.dureeMinutes)}
            </span>
            <span className="min-w-0 flex-1 truncate text-zinc-600 dark:text-zinc-400">
              <span className="font-mono text-xs text-zinc-400">
                {l.dossier}
              </span>{" "}
              {l.description}
            </span>
            <span className="w-24 shrink-0 text-right">
              {formatEuros(l.montant)}
            </span>
          </label>
        ))}
      </div>

      <div className="flex items-center justify-end gap-3 text-sm">
        <span className="text-zinc-500">
          {checked.size} ligne{checked.size > 1 ? "s" : ""} sélectionnée
          {checked.size > 1 ? "s" : ""}
        </span>
        <span className="text-lg font-semibold">{formatEuros(total)}</span>
      </div>

      <div className="grid max-w-md grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Échéance de paiement
          </span>
          <input name="date_echeance" type="date" className={inputCls} />
        </label>
      </div>

      <label className="flex max-w-md flex-col gap-1.5">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Notes
        </span>
        <textarea name="notes" rows={2} className={inputCls} />
      </label>

      {state.error && (
        <p className="max-w-md rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending || checked.size === 0}
          className="rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {pending ? "…" : "Générer la facture"}
        </button>
        <Link
          href="/factures"
          className="rounded-md px-4 py-2.5 text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          Annuler
        </Link>
      </div>
    </form>
  );
}
