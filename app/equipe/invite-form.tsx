"use client";

import { useActionState, useState } from "react";
import { inviteMember } from "./actions";

const inputCls =
  "rounded-md border border-border-strong bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-border-strong dark:bg-zinc-900 dark:focus:border-zinc-100";

export function InviteForm() {
  const [state, action, pending] = useActionState(inviteMember, {});
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!state.inviteUrl) return;
    try {
      await navigator.clipboard.writeText(state.inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // copie indisponible (contexte non sécurisé) — le lien reste sélectionnable
    }
  }

  return (
    <div className="card max-w-xl p-5">
      <h2 className="text-sm font-semibold">Inviter un collaborateur</h2>
      <p className="mt-1 text-sm text-muted">
        Générez un lien d&apos;invitation à transmettre à la personne (email,
        messagerie…). Valable 14 jours.
      </p>

      <form action={action} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex flex-1 flex-col gap-1.5">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Email
          </span>
          <input
            name="email"
            type="email"
            required
            placeholder="collaborateur@cabinet.fr"
            autoComplete="off"
            className={inputCls}
          />
        </label>
        <label className="flex flex-col gap-1.5 sm:w-40">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Rôle
          </span>
          <select name="role" defaultValue="avocat" className={inputCls}>
            <option value="avocat">Avocat</option>
            <option value="assistant">Assistant</option>
          </select>
        </label>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {pending ? "…" : "Créer l'invitation"}
        </button>
      </form>

      {state.error && (
        <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {state.error}
        </p>
      )}

      {state.message && state.inviteUrl && (
        <div className="mt-4 rounded-md border border-border bg-surface-2 p-3">
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
            {state.message}
          </p>
          <p className="mt-1 text-xs text-muted">
            Copiez ce lien et envoyez-le à la personne :
          </p>
          <div className="mt-2 flex items-center gap-2">
            <input
              readOnly
              value={state.inviteUrl}
              onFocus={(e) => e.currentTarget.select()}
              className={`${inputCls} flex-1 font-mono text-xs`}
            />
            <button
              type="button"
              onClick={copy}
              className="shrink-0 rounded-md border border-border-strong px-3 py-2 text-sm font-medium transition-colors hover:bg-black/[0.04] dark:hover:bg-white/5"
            >
              {copied ? "Copié ✓" : "Copier"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
