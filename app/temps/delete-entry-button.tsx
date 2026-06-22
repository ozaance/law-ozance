"use client";

import { useTransition } from "react";
import { deleteTimeEntry } from "./actions";

export function DeleteEntryButton({
  id,
  dossierId,
}: {
  id: string;
  dossierId: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      aria-label="Supprimer la saisie"
      onClick={() => startTransition(() => deleteTimeEntry(id, dossierId))}
      className="text-zinc-400 transition-colors hover:text-red-600 disabled:opacity-50"
    >
      ✕
    </button>
  );
}
