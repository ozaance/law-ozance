"use client";

import { useActionState } from "react";
import { deleteMyAccount, type DeleteState } from "./danger-actions";

export function DeleteAccount({ soleMember }: { soleMember: boolean }) {
  const [state, action, pending] = useActionState<DeleteState, FormData>(
    deleteMyAccount,
    {},
  );

  return (
    <section className="mt-12 rounded-xl border border-red-200 bg-red-50/50 p-6 dark:border-red-900 dark:bg-red-950/30">
      <h2 className="text-lg font-semibold tracking-tight text-red-700 dark:text-red-300">
        Supprimer mon compte
      </h2>
      <p className="mb-4 mt-1 text-sm text-red-700/90 dark:text-red-300/90">
        Cette action est <strong>définitive et irréversible</strong>.
        {soleMember ? (
          <>
            {" "}
            Vous êtes le seul membre : votre cabinet et{" "}
            <strong>toutes ses données</strong> (clients, dossiers, factures…)
            seront supprimés, et votre abonnement annulé.
          </>
        ) : (
          <>
            {" "}
            Votre compte sera supprimé ; le cabinet et les données partagées
            seront conservés pour les autres membres.
          </>
        )}
      </p>

      <form action={action} className="flex max-w-sm flex-col gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-red-700 dark:text-red-300">
            Tapez <code className="font-mono">SUPPRIMER</code> pour confirmer
          </span>
          <input
            name="confirm"
            autoComplete="off"
            placeholder="SUPPRIMER"
            className="rounded-md border border-red-300 bg-white px-3 py-2 text-sm outline-none focus:border-red-600 dark:border-red-800 dark:bg-zinc-900"
          />
        </label>

        {state.error && (
          <p className="text-sm text-red-700 dark:text-red-300">{state.error}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="self-start rounded-md bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Suppression…" : "Supprimer définitivement mon compte"}
        </button>
      </form>
    </section>
  );
}
