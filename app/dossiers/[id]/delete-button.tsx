"use client";

import { useTransition } from "react";
import { deleteDossierAction } from "../actions";

export function DeleteDossierButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (confirm("Supprimer définitivement ce dossier ?")) {
          startTransition(() => deleteDossierAction(id));
        }
      }}
      className="rounded-md border border-red-300 px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:hover:bg-red-950"
    >
      {pending ? "…" : "Supprimer"}
    </button>
  );
}
