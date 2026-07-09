"use client";

import { useActionState } from "react";
import { useIsNative } from "@/lib/native";
import {
  buyCreditsAction,
  disableByok,
  saveByokKey,
  type ByokState,
} from "./actions";

const card = "rounded-xl border border-border bg-white p-4 dark:bg-zinc-900";

export type UsageRow = {
  id: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  cost_cents: number;
  byok: boolean;
  created_at: string;
};

function euros(cents: number) {
  return (cents / 100).toLocaleString("fr-FR", {
    style: "currency",
    currency: "EUR",
  });
}

export function CreditsClient({
  isAdmin,
  balanceCents,
  byokEnabled,
  packs,
  usage,
  monthCostCents,
  flash,
}: {
  isAdmin: boolean;
  balanceCents: number;
  byokEnabled: boolean;
  packs: number[];
  usage: UsageRow[];
  monthCostCents: number;
  flash?: string;
}) {
  const [byokState, byokAction, byokPending] = useActionState<ByokState, FormData>(
    saveByokKey,
    {},
  );
  const [offState, offAction] = useActionState<ByokState, FormData>(
    disableByok,
    {},
  );
  const native = useIsNative();

  return (
    <div className="flex flex-col gap-8">
      {flash && (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
          {flash}
        </p>
      )}

      {/* Solde */}
      <section className={card}>
        <p className="text-xs font-medium text-muted">Solde de crédits IA</p>
        <p className="mt-1 text-3xl font-semibold tracking-tight">
          {byokEnabled ? "—" : euros(balanceCents)}
        </p>
        {byokEnabled ? (
          <p className="mt-1 text-sm text-muted">
            Le cabinet utilise sa propre clé Anthropic : la facturation se fait
            directement chez Anthropic, sans débit de crédits.
          </p>
        ) : (
          <p className="mt-1 text-sm text-muted">
            Consommé ce mois-ci : {euros(monthCostCents)}.
            {balanceCents <= 0 && (
              <span className="text-red-600 dark:text-red-400">
                {" "}
                Solde épuisé — rechargez pour utiliser l&apos;assistant.
              </span>
            )}
          </p>
        )}
      </section>

      {/* Recharge — masquée dans l'app native (règle Apple 3.1.1) */}
      {!byokEnabled && native && (
        <section className={card}>
          <p className="text-sm text-muted">
            La recharge de crédits se gère depuis la version web de Ozance.
          </p>
        </section>
      )}
      {!byokEnabled && !native && (
        <section>
          <h2 className="mb-1 text-lg font-semibold tracking-tight">Recharger</h2>
          <p className="mb-4 text-sm text-muted">
            {isAdmin
              ? "Achetez des crédits pour l'assistant IA (paiement sécurisé Stripe)."
              : "Seul un administrateur peut recharger le portefeuille du cabinet."}
          </p>
          {isAdmin && (
            <div className="flex flex-wrap gap-3">
              {packs.map((cents) => (
                <form key={cents} action={buyCreditsAction}>
                  <input type="hidden" name="cents" value={cents} />
                  <button
                    type="submit"
                    className="rounded-lg border border-border-strong px-5 py-3 text-sm font-medium transition-colors hover:bg-black/[0.04] dark:hover:bg-white/5"
                  >
                    + {euros(cents)}
                  </button>
                </form>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Clé propre (BYOK) — admin */}
      {isAdmin && (
        <section className="border-t border-border pt-6">
          <h2 className="text-lg font-semibold tracking-tight">
            Utiliser votre propre clé Anthropic (avancé)
          </h2>
          <p className="mb-4 mt-1 text-sm text-muted">
            Si le cabinet a un compte Anthropic, saisissez sa clé API : Anthropic
            vous facturera directement et aucun crédit ne sera débité.
          </p>

          {byokEnabled ? (
            <form action={offAction} className="flex items-center gap-3">
              <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                Clé du cabinet active
              </span>
              <button
                type="submit"
                className="rounded-md border border-border-strong px-3 py-1.5 text-xs font-medium transition-colors hover:bg-black/[0.04] dark:hover:bg-white/5"
              >
                Désactiver et revenir aux crédits
              </button>
            </form>
          ) : (
            <form action={byokAction} className="flex max-w-md items-end gap-2">
              <label className="flex flex-1 flex-col gap-1.5">
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Clé API Anthropic
                </span>
                <input
                  name="key"
                  type="password"
                  placeholder="sk-ant-…"
                  className="rounded-md border border-border-strong bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:bg-zinc-900 dark:focus:border-zinc-100"
                />
              </label>
              <button
                type="submit"
                disabled={byokPending}
                className="rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
              >
                {byokPending ? "…" : "Activer"}
              </button>
            </form>
          )}
          {(byokState.error || offState.error) && (
            <p className="mt-2 text-xs text-red-600">
              {byokState.error ?? offState.error}
            </p>
          )}
          {(byokState.message || offState.message) && (
            <p className="mt-2 text-xs text-emerald-600">
              {byokState.message ?? offState.message}
            </p>
          )}
        </section>
      )}

      {/* Historique récent */}
      {usage.length > 0 && (
        <section className="border-t border-border pt-6">
          <h2 className="mb-3 text-lg font-semibold tracking-tight">
            Consommation récente
          </h2>
          <ul className="flex flex-col gap-2">
            {usage.map((u) => (
              <li
                key={u.id}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <span className="text-muted">
                  {new Date(u.created_at).toLocaleString("fr-FR", {
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  · {(u.input_tokens + u.output_tokens).toLocaleString("fr-FR")}{" "}
                  tokens
                </span>
                <span className="font-medium">
                  {u.byok ? "clé cabinet" : euros(u.cost_cents)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
