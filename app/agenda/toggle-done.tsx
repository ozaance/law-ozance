"use client";

import { useTransition } from "react";
import { toggleEvenementAction } from "./actions";

export function ToggleDone({
  id,
  termine,
}: {
  id: string;
  termine: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      aria-label={termine ? "Marquer à faire" : "Marquer terminé"}
      onClick={() =>
        startTransition(() => toggleEvenementAction(id, !termine))
      }
      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border text-xs transition-colors disabled:opacity-50 ${
        termine
          ? "border-emerald-500 bg-emerald-500 text-white"
          : "border-zinc-300 hover:border-zinc-500 dark:border-zinc-600"
      }`}
    >
      {termine ? "✓" : ""}
    </button>
  );
}
