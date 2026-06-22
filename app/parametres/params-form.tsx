"use client";

import { useActionState } from "react";
import { updateMonProfil } from "./actions";

const inputCls =
  "rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-100";

export function ParamsForm({
  nomComplet,
  tauxHoraire,
}: {
  nomComplet: string | null;
  tauxHoraire: number | null;
}) {
  const [state, action, pending] = useActionState(updateMonProfil, {});

  return (
    <form action={action} className="flex max-w-sm flex-col gap-5">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Nom complet
        </span>
        <input
          name="nom_complet"
          defaultValue={nomComplet ?? ""}
          className={inputCls}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Taux horaire par défaut (€/h)
        </span>
        <input
          name="taux_horaire"
          type="number"
          step="1"
          min="0"
          placeholder="ex. 250"
          defaultValue={tauxHoraire ?? ""}
          className={inputCls}
        />
        <span className="text-xs text-zinc-400">
          Appliqué par défaut à vos saisies de temps (surchargeable par dossier).
        </span>
      </label>

      {state.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {state.error}
        </p>
      )}
      {state.message && (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {pending ? "…" : "Enregistrer"}
      </button>
    </form>
  );
}
