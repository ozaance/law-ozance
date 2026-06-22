"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { DossierFormState } from "./actions";
import { STATUTS, TYPES_AFFAIRE } from "./constants";

export type DossierDefaults = {
  client_id?: string;
  avocat_id?: string | null;
  titre?: string;
  type_affaire?: string;
  statut?: string;
  description?: string | null;
  date_ouverture?: string | null;
  date_cloture?: string | null;
  taux_horaire?: number | null;
};

type Option = { id: string; label: string };

const inputCls =
  "rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-100";

export function DossierForm({
  action,
  clients,
  avocats,
  defaults = {},
  submitLabel,
  cancelHref,
}: {
  action: (
    state: DossierFormState,
    formData: FormData,
  ) => Promise<DossierFormState>;
  clients: Option[];
  avocats: Option[];
  defaults?: DossierDefaults;
  submitLabel: string;
  cancelHref: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-5">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Client <span className="text-red-500">*</span>
        </span>
        <select
          name="client_id"
          required
          defaultValue={defaults.client_id ?? ""}
          className={inputCls}
        >
          <option value="" disabled>
            Sélectionner un client…
          </option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Titre de l&apos;affaire <span className="text-red-500">*</span>
        </span>
        <input
          name="titre"
          required
          defaultValue={defaults.titre ?? ""}
          className={inputCls}
        />
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Type d&apos;affaire
          </span>
          <select
            name="type_affaire"
            defaultValue={defaults.type_affaire ?? "conseil"}
            className={inputCls}
          >
            {Object.entries(TYPES_AFFAIRE).map(([v, label]) => (
              <option key={v} value={v}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Statut
          </span>
          <select
            name="statut"
            defaultValue={defaults.statut ?? "ouvert"}
            className={inputCls}
          >
            {Object.entries(STATUTS).map(([v, label]) => (
              <option key={v} value={v}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Avocat responsable
          </span>
          <select
            name="avocat_id"
            defaultValue={defaults.avocat_id ?? ""}
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
            Taux horaire du dossier (€/h)
          </span>
          <input
            name="taux_horaire"
            type="number"
            step="1"
            min="0"
            placeholder="défaut avocat"
            defaultValue={defaults.taux_horaire ?? ""}
            className={inputCls}
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Date d&apos;ouverture
          </span>
          <input
            name="date_ouverture"
            type="date"
            defaultValue={defaults.date_ouverture ?? ""}
            className={inputCls}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Date de clôture
          </span>
          <input
            name="date_cloture"
            type="date"
            defaultValue={defaults.date_cloture ?? ""}
            className={inputCls}
          />
        </label>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Description
        </span>
        <textarea
          name="description"
          rows={3}
          defaultValue={defaults.description ?? ""}
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
