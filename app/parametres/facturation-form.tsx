"use client";

import { useActionState } from "react";
import { updateCabinetFacturation } from "./actions";

const inputCls =
  "rounded-md border border-border-strong bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-border-strong dark:bg-zinc-900 dark:focus:border-zinc-100";

export type FacturationDefaults = {
  barreau?: string | null;
  telephone?: string | null;
  site_web?: string | null;
  logo_url?: string | null;
  adresse?: string | null;
  code_postal?: string | null;
  ville?: string | null;
  forme_juridique?: string | null;
  siret?: string | null;
  tva_intra?: string | null;
  iban?: string | null;
  bic?: string | null;
  tva_assujetti?: boolean;
  tva_taux?: number | null;
  conditions_reglement?: string | null;
  mentions_facture?: string | null;
};

function F({
  label,
  name,
  defaultValue,
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {label}
      </span>
      <input
        name={name}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        className={inputCls}
      />
    </label>
  );
}

export function FacturationForm({ defaults }: { defaults: FacturationDefaults }) {
  const [state, action, pending] = useActionState(updateCabinetFacturation, {});

  return (
    <form action={action} className="flex max-w-2xl flex-col gap-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <F label="Barreau" name="barreau" placeholder="Paris, Luxembourg…" defaultValue={defaults.barreau} />
        <F label="Forme juridique" name="forme_juridique" placeholder="SELARL, SCP…" defaultValue={defaults.forme_juridique} />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <F label="Téléphone" name="telephone" defaultValue={defaults.telephone} />
        <F label="Site web" name="site_web" placeholder="www.…" defaultValue={defaults.site_web} />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <F label="SIRET" name="siret" defaultValue={defaults.siret} />
        <F label="Logo (URL)" name="logo_url" placeholder="https://…/logo.png" defaultValue={defaults.logo_url} />
      </div>

      <F label="Adresse" name="adresse" defaultValue={defaults.adresse} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <F label="Code postal" name="code_postal" defaultValue={defaults.code_postal} />
        <F label="Ville" name="ville" defaultValue={defaults.ville} />
      </div>

      <F label="N° TVA intracommunautaire" name="tva_intra" placeholder="FR..." defaultValue={defaults.tva_intra} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <F label="IBAN" name="iban" defaultValue={defaults.iban} />
        <F label="BIC" name="bic" defaultValue={defaults.bic} />
      </div>

      <div className="flex flex-wrap items-end gap-6 rounded-lg border border-border p-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="tva_assujetti"
            defaultChecked={defaults.tva_assujetti ?? true}
            className="h-4 w-4"
          />
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Assujetti à la TVA
          </span>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Taux de TVA (%)
          </span>
          <input
            name="tva_taux"
            type="number"
            step="0.1"
            min="0"
            defaultValue={defaults.tva_taux ?? 20}
            className={`${inputCls} w-28`}
          />
        </label>
        <p className="text-xs text-muted">
          Décochez si vous êtes en franchise en base (mention « TVA non
          applicable, art. 293 B du CGI »).
        </p>
      </div>

      <F
        label="Conditions de règlement"
        name="conditions_reglement"
        placeholder="Payable au comptant, à réception"
        defaultValue={defaults.conditions_reglement}
      />

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Mentions de bas de facture
        </span>
        <textarea
          name="mentions_facture"
          rows={3}
          defaultValue={defaults.mentions_facture ?? ""}
          placeholder="Pénalités de retard, escompte, mentions Barreau/CARPA…"
          className={inputCls}
        />
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
