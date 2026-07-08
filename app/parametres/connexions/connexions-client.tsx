"use client";

import { useActionState } from "react";
import {
  createMcpToken,
  disconnectConnexion,
  revokeMcpToken,
  type ConnexionState,
} from "./actions";
import { CATEGORY_LABELS, type ConnectorCategory } from "@/lib/connectors/registry";

export type ProviderView = {
  id: string;
  label: string;
  description: string;
  emoji: string;
  configured: boolean;
  setupUrl: string;
};

export type ConnexionView = {
  id: string;
  provider: string;
  status: string;
  account_email: string | null;
  account_label: string | null;
  updated_at: string;
};

export type McpTokenView = {
  id: string;
  name: string;
  token_prefix: string;
  last_used_at: string | null;
  created_at: string;
};

const card =
  "rounded-xl border border-border bg-white p-4 dark:bg-zinc-900";

function DisconnectButton({ id }: { id: string }) {
  const [state, action, pending] = useActionState<ConnexionState, FormData>(
    disconnectConnexion,
    {},
  );
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        disabled={pending}
        className="rounded-md border border-border-strong px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950"
      >
        {pending ? "…" : "Déconnecter"}
      </button>
      {state.error && (
        <span className="ml-2 text-xs text-red-600">{state.error}</span>
      )}
    </form>
  );
}

export function ConnexionsClient({
  categories,
  connexionsByProvider,
  isAdmin,
  mcpEndpoint,
  mcpTokens,
  flash,
}: {
  categories: {
    key: ConnectorCategory;
    providers: ProviderView[];
  }[];
  connexionsByProvider: Record<string, ConnexionView[]>;
  isAdmin: boolean;
  mcpEndpoint: string;
  mcpTokens: McpTokenView[];
  flash: { error?: string; message?: string };
}) {
  return (
    <div className="flex flex-col gap-10">
      {flash.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {flash.error}
        </p>
      )}
      {flash.message && (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
          {flash.message}
        </p>
      )}

      {categories.map(({ key, providers }) => (
        <section key={key}>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">
            {CATEGORY_LABELS[key]}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {providers.map((p) => {
              const conns = connexionsByProvider[p.id] ?? [];
              return (
                <div key={p.id} className={card}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className="text-xl" aria-hidden>
                        {p.emoji}
                      </span>
                      <div>
                        <p className="text-sm font-semibold">{p.label}</p>
                        <p className="mt-0.5 text-xs text-muted">
                          {p.description}
                        </p>
                      </div>
                    </div>
                    {conns.length === 0 &&
                      (p.configured ? (
                        <a
                          href={`/api/connectors/${p.id}/authorize`}
                          className="shrink-0 rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 dark:bg-zinc-100 dark:text-zinc-900"
                        >
                          Connecter
                        </a>
                      ) : (
                        <span
                          className="shrink-0 rounded-md border border-border-strong px-2 py-1 text-[11px] text-muted"
                          title="Identifiants OAuth manquants dans l'environnement"
                        >
                          Non configuré
                        </span>
                      ))}
                  </div>

                  {conns.length > 0 && (
                    <ul className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
                      {conns.map((c) => (
                        <li
                          key={c.id}
                          className="flex items-center justify-between gap-2"
                        >
                          <span className="min-w-0 truncate text-xs">
                            <span
                              className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${
                                c.status === "connected"
                                  ? "bg-emerald-500"
                                  : "bg-amber-500"
                              }`}
                            />
                            {c.account_email ??
                              c.account_label ??
                              "Compte relié"}
                          </span>
                          <DisconnectButton id={c.id} />
                        </li>
                      ))}
                      {p.configured && (
                        <li>
                          <a
                            href={`/api/connectors/${p.id}/authorize`}
                            className="text-xs font-medium text-accent hover:underline"
                          >
                            + Ajouter un autre compte
                          </a>
                        </li>
                      )}
                    </ul>
                  )}

                  {!p.configured && conns.length === 0 && (
                    <a
                      href={p.setupUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-block text-[11px] text-muted hover:underline"
                    >
                      Configurer l&apos;application OAuth ↗
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}

      {isAdmin && (
        <McpSection endpoint={mcpEndpoint} tokens={mcpTokens} />
      )}
    </div>
  );
}

function McpSection({
  endpoint,
  tokens,
}: {
  endpoint: string;
  tokens: McpTokenView[];
}) {
  const [createState, createAction, creating] = useActionState<
    ConnexionState,
    FormData
  >(createMcpToken, {});
  const [revokeState, revokeAction] = useActionState<ConnexionState, FormData>(
    revokeMcpToken,
    {},
  );

  return (
    <section className="border-t border-border pt-8">
      <h2 className="text-lg font-semibold tracking-tight">
        Assistant IA (MCP)
      </h2>
      <p className="mb-4 mt-1 text-sm text-muted">
        Exposez les données de votre cabinet (clients, dossiers, factures,
        agenda) en lecture seule à un assistant compatible{" "}
        <span className="font-medium">Model Context Protocol</span> (Claude,
        etc.). L&apos;assistant s&apos;authentifie avec un jeton dédié.
      </p>

      <div className={card}>
        <p className="text-xs font-medium text-muted">Point d&apos;accès MCP</p>
        <code className="mt-1 block break-all rounded bg-black/5 px-2 py-1.5 text-xs dark:bg-white/10">
          {endpoint}
        </code>
      </div>

      <form action={createAction} className="mt-4 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Nom du jeton
          </span>
          <input
            name="name"
            placeholder="ex. Claude Desktop"
            className="rounded-md border border-border-strong bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:bg-zinc-900 dark:focus:border-zinc-100"
          />
        </label>
        <button
          type="submit"
          disabled={creating}
          className="rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {creating ? "…" : "Générer un jeton"}
        </button>
      </form>

      {createState.error && (
        <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {createState.error}
        </p>
      )}
      {createState.newToken && (
        <div className="mt-3 rounded-md bg-amber-50 px-3 py-3 dark:bg-amber-950">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            Copiez ce jeton maintenant — il ne sera plus affiché :
          </p>
          <code className="mt-2 block break-all rounded bg-black/10 px-2 py-1.5 text-xs dark:bg-white/10">
            {createState.newToken}
          </code>
        </div>
      )}

      {tokens.length > 0 && (
        <ul className="mt-5 flex flex-col gap-2">
          {tokens.map((t) => (
            <li
              key={t.id}
              className={`flex items-center justify-between gap-3 ${card}`}
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{t.name}</p>
                <p className="text-xs text-muted">
                  {t.token_prefix} · créé le{" "}
                  {new Date(t.created_at).toLocaleDateString("fr-FR")}
                  {t.last_used_at
                    ? ` · dernier usage ${new Date(
                        t.last_used_at,
                      ).toLocaleDateString("fr-FR")}`
                    : " · jamais utilisé"}
                </p>
              </div>
              <form action={revokeAction}>
                <input type="hidden" name="id" value={t.id} />
                <button
                  type="submit"
                  className="rounded-md border border-border-strong px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
                >
                  Révoquer
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
      {revokeState.error && (
        <p className="mt-3 text-xs text-red-600">{revokeState.error}</p>
      )}
    </section>
  );
}
