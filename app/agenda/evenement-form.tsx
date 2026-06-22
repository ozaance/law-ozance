"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { EvenementFormState } from "./actions";
import { TYPES_EVENEMENT } from "./constants";

export type EvenementDefaults = {
  type?: string;
  titre?: string;
  dossier_id?: string | null;
  assigne_a?: string | null;
  date_evenement?: string | null;
  heure?: string | null;
  lieu?: string | null;
  notes?: string | null;
};

type Option = { id: string; label: string };

const inputCls =
  "rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-100";

export function EvenementForm({
  action,
  dossiers,
  avocats,
  defaults = {},
  submitLabel,
  cancelHref,
}: {
  action: (
    state: EvenementFormState,
    formData: FormData,
  ) => Promise<EvenementFormState>;
  dossiers: Option[];
  avocats: Option[];
  defaults?: EvenementDefaults;
  submitLabel: string;
  cancelHref: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-5">
      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Type
          </span>
          <select
            name="type"
            defaultValue={defaults.type ?? "echeance"}
            className={inputCls}
          >
            {Object.entries(TYPES_EVENEMENT).map(([v, label]) => (
              <option key={v} value={v}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Dossier lié
          </span>
          <select
            name="dossier_id"
            defaultValue={defaults.dossier_id ?? ""}
            className={inputCls}
          >
            <option value="">— Aucun —</option>
            {dossiers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Intitulé <span className="text-red-500">*</span>
        </span>
        <input
          name="titre"
          required
          defaultValue={defaults.titre ?? ""}
          className={inputCls}
        />
      </label>

      <div className="grid grid-cols-3 gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Date <span className="text-red-500">*</span>
          </span>
          <input
            name="date_evenement"
            type="date"
            required
            defaultValue={defaults.date_evenement ?? ""}
            className={inputCls}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Heure
          </span>
          <input
            name="heure"
            type="time"
            defaultValue={defaults.heure ?? ""}
            className={inputCls}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Lieu
          </span>
          <input
            name="lieu"
            defaultValue={defaults.lieu ?? ""}
            className={inputCls}
          />
        </label>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Assigné à
        </span>
        <select
          name="assigne_a"
          defaultValue={defaults.assigne_a ?? ""}
          className={inputCls}
        >
          <option value="">— Non assigné —</option>
          {avocats.map((a) => (
            <option key={a.id} value={a.id}>
              {a.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Notes
        </span>
        <textarea
          name="notes"
          rows={3}
          defaultValue={defaults.notes ?? ""}
          className={inputCls}
        />
      </label>

      {state.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {pending ? "…" : submitLabel}
        </button>
        <Link
          href={cancelHref}
          className="rounded-md px-4 py-2.5 text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          Annuler
        </Link>
      </div>
    </form>
  );
}
