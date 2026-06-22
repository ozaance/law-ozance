"use client";

import { useTransition } from "react";
import { deleteFacture } from "../actions";

export function DeleteFactureButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (
          confirm(
            "Supprimer cette facture ? Les saisies de temps redeviendront facturables.",
          )
        ) {
          startTransition(() => deleteFacture(id));
        }
      }}
      className="rounded-md border border-red-300 px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:hover:bg-red-950"
    >
      {pending ? "…" : "Supprimer"}
    </button>
  );
}
