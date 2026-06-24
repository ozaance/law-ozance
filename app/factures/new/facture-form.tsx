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

type Mode = "temps" | "forfait";
type LigneLibre = { key: number; designation: string; montant: string };

const inputCls =
  "rounded-md border border-border-strong bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-border-strong dark:bg-zinc-900 dark:focus:border-zinc-100";

export function FactureForm({
  clientId,
  lignes,
}: {
  clientId: string;
  lignes: Ligne[];
}) {
  const [state, action, pending] = useActionState(createFacture, {});
  const [mode, setMode] = useState<Mode>(lignes.length ? "temps" : "forfait");

  // Mode temps
  const [checked, setChecked] = useState<Set<string>>(
    () => new Set(lignes.map((l) => l.id)),
  );
  const totalTemps = useMemo(
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

  // Mode forfait
  const [libres, setLibres] = useState<LigneLibre[]>([
    { key: 1, designation: "", montant: "" },
  ]);
  const totalForfait = useMemo(
    () =>
      libres.reduce((s, l) => {
        const n = Number(l.montant.replace(",", "."));
        return s + (Number.isFinite(n) ? n : 0);
      }, 0),
    [libres],
  );
  function setLibre(key: number, patch: Partial<LigneLibre>) {
    setLibres((prev) =>
      prev.map((l) => (l.key === key ? { ...l, ...patch } : l)),
    );
  }
  function addLibre() {
    setLibres((prev) => [
      ...prev,
      { key: (prev.at(-1)?.key ?? 0) + 1, designation: "", montant: "" },
    ]);
  }
  function removeLibre(key: number) {
    setLibres((prev) =>
      prev.length > 1 ? prev.filter((l) => l.key !== key) : prev,
    );
  }

  const total = mode === "temps" ? totalTemps : totalForfait;

  return (
    <form action={action} className="flex flex-col gap-6">
      <input type="hidden" name="client_id" value={clientId} />
      <input type="hidden" name="mode" value={mode} />

      {/* Bascule de mode */}
      <div className="flex w-full max-w-sm gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-900">
        {(
          [
            ["temps", "Au temps passé"],
            ["forfait", "Au forfait"],
          ] as const
        ).map(([m, label]) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              mode === m ? "bg-white shadow-sm dark:bg-zinc-800" : "text-muted"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Objet de l'affaire (commun) */}
      <label className="flex max-w-2xl flex-col gap-1.5">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Objet / Affaire
        </span>
        <input
          name="objet"
          placeholder="Ex. Affaire X c/ Y — Contentieux commercial"
          className={inputCls}
        />
      </label>

      {mode === "temps" ? (
        lignes.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border-strong py-10 text-center dark:border-border-strong">
            <p className="text-sm text-muted">
              Aucune saisie de temps à facturer pour ce client.
            </p>
            <p className="mt-1 text-xs text-zinc-400">
              Passez « Au forfait » ou ajoutez du temps depuis les dossiers.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow-sm)] dark:border-border">
            {lignes.map((l) => (
              <div
                key={l.id}
                className="flex items-center gap-3 border-b border-border px-4 py-2.5 text-sm last:border-0 dark:border-border"
              >
                <input
                  type="checkbox"
                  name="entries"
                  value={l.id}
                  checked={checked.has(l.id)}
                  onChange={() => toggle(l.id)}
                  className="h-4 w-4 shrink-0"
                />
                <span className="w-20 shrink-0 text-xs text-muted">{l.date}</span>
                <span className="w-14 shrink-0 font-medium">
                  {formatDuree(l.dureeMinutes)}
                </span>
                <span className="shrink-0 font-mono text-xs text-zinc-400">
                  {l.dossier}
                </span>
                <input
                  name={`desc_${l.id}`}
                  defaultValue={l.description}
                  placeholder="Objet de la prestation"
                  className="min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-2 py-1 text-sm text-zinc-700 outline-none hover:border-border-strong focus:border-zinc-900 focus:bg-white dark:text-zinc-300 dark:focus:border-zinc-100 dark:focus:bg-zinc-900"
                />
                <span className="w-24 shrink-0 text-right">
                  {formatEuros(l.montant)}
                </span>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="flex flex-col gap-3">
          {libres.map((l) => (
            <div
              key={l.key}
              className="flex items-start gap-3 rounded-xl border border-border bg-surface p-3 shadow-[var(--shadow-sm)] dark:border-border"
            >
              <textarea
                name="ligne_designation"
                value={l.designation}
                onChange={(e) => setLibre(l.key, { designation: e.target.value })}
                rows={2}
                placeholder="Désignation de la prestation (ex. Phase 1 — Analyse & stratégie : étude des statuts, …)"
                className={`min-w-0 flex-1 ${inputCls}`}
              />
              <div className="flex w-36 shrink-0 flex-col gap-1">
                <div className="relative">
                  <input
                    name="ligne_montant"
                    value={l.montant}
                    onChange={(e) => setLibre(l.key, { montant: e.target.value })}
                    inputMode="decimal"
                    placeholder="0,00"
                    className={`${inputCls} w-full pr-7 text-right`}
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted">
                    €
                  </span>
                </div>
                <span className="text-right text-[10px] text-zinc-400">HT</span>
              </div>
              <button
                type="button"
                onClick={() => removeLibre(l.key)}
                aria-label="Supprimer la ligne"
                className="mt-1 shrink-0 rounded-md px-2 py-1 text-sm text-muted hover:text-red-600"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addLibre}
            className="self-start rounded-md border border-border-strong px-3 py-1.5 text-sm font-medium transition-colors hover:bg-black/[0.04] dark:hover:bg-white/5"
          >
            + Ajouter une ligne
          </button>
        </div>
      )}

      <div className="flex items-center justify-end gap-3 text-sm">
        <span className="text-muted">Total HT</span>
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

      <label className="flex max-w-2xl flex-col gap-1.5">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Honoraire de résultat (optionnel)
        </span>
        <textarea
          name="honoraire_resultat"
          rows={2}
          placeholder="Ex. Un honoraire de résultat pourra être sollicité selon l'issue de la procédure…"
          className={inputCls}
        />
      </label>

      <label className="flex max-w-2xl flex-col gap-1.5">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Notes / détails de la facturation
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
          disabled={pending || (mode === "temps" && checked.size === 0)}
          className="rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {pending ? "…" : "Générer la note d'honoraires"}
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
