"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import type { ClientFormState } from "./actions";

type ClientType = "entreprise" | "particulier";

export type ClientDefaults = {
  type?: ClientType;
  nom?: string;
  siren?: string | null;
  forme_juridique?: string | null;
  email?: string | null;
  telephone?: string | null;
  notes?: string | null;
};

export function ClientForm({
  action,
  defaults = {},
  submitLabel,
  cancelHref,
}: {
  action: (
    state: ClientFormState,
    formData: FormData,
  ) => Promise<ClientFormState>;
  defaults?: ClientDefaults;
  submitLabel: string;
  cancelHref: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const [type, setType] = useState<ClientType>(defaults.type ?? "entreprise");

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-5">
      <input type="hidden" name="type" value={type} />

      <div className="flex gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-900">
        {(["entreprise", "particulier"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium capitalize transition-colors ${
              type === t ? "bg-white shadow-sm dark:bg-zinc-800" : "text-zinc-500"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <Field
        label={type === "entreprise" ? "Raison sociale" : "Nom complet"}
        name="nom"
        defaultValue={defaults.nom}
        required
      />

      {type === "entreprise" && (
        <div className="grid grid-cols-2 gap-4">
          <Field label="SIREN" name="siren" defaultValue={defaults.siren ?? ""} />
          <Field
            label="Forme juridique"
            name="forme_juridique"
            placeholder="SAS, SARL…"
            defaultValue={defaults.forme_juridique ?? ""}
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Field
          label="Email"
          name="email"
          type="email"
          defaultValue={defaults.email ?? ""}
        />
        <Field
          label="Téléphone"
          name="telephone"
          defaultValue={defaults.telephone ?? ""}
        />
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Notes
        </span>
        <textarea
          name="notes"
          rows={3}
          defaultValue={defaults.notes ?? ""}
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-100"
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

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  placeholder,
  required,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string | null;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue ?? ""}
        className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-100"
      />
    </label>
  );
}
