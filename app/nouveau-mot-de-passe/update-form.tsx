"use client";

import { useActionState } from "react";
import { updatePassword } from "@/app/auth/actions";

const inputCls =
  "rounded-md border border-border-strong bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-border-strong dark:bg-zinc-900 dark:focus:border-zinc-100";

export function UpdateForm() {
  const [state, action, pending] = useActionState(updatePassword, {});

  return (
    <form action={action} className="flex w-full max-w-sm flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Nouveau mot de passe
        </span>
        <input
          name="password"
          type="password"
          required
          autoComplete="new-password"
          className={inputCls}
        />
        <span className="text-xs text-zinc-400">8 caractères minimum</span>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Confirmer le mot de passe
        </span>
        <input
          name="confirm"
          type="password"
          required
          autoComplete="new-password"
          className={inputCls}
        />
      </label>

      {state.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-zinc-900 px-3 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {pending ? "…" : "Définir le mot de passe"}
      </button>
    </form>
  );
}
