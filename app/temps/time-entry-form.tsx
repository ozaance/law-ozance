"use client";

import { useActionState, useEffect, useRef } from "react";
import { createTimeEntry } from "./actions";

const inputCls =
  "rounded-md border border-border-strong bg-white px-2 py-1.5 text-sm outline-none focus:border-zinc-900 dark:border-border-strong dark:bg-zinc-900 dark:focus:border-zinc-100";

export function TimeEntryForm({
  dossierId,
  tauxSuggere,
}: {
  dossierId: string;
  tauxSuggere: number | null;
}) {
  const action = createTimeEntry.bind(null, dossierId);
  const [state, formAction, pending] = useActionState(action, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ts) formRef.current?.reset();
  }, [state.ts]);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="mt-3 rounded-lg border border-border p-3 dark:border-border"
    >
      <div className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-muted">Date</span>
          <input
            name="date_saisie"
            type="date"
            defaultValue={today}
            className={inputCls}
          />
        </label>
        <label className="flex w-20 flex-col gap-1">
          <span className="text-xs text-muted">Heures</span>
          <input
            name="heures"
            type="number"
            step="0.1"
            min="0"
            placeholder="1.5"
            required
            className={inputCls}
          />
        </label>
        <label className="flex w-24 flex-col gap-1">
          <span className="text-xs text-muted">Taux €/h</span>
          <input
            name="taux"
            type="number"
            step="1"
            min="0"
            defaultValue={tauxSuggere ?? ""}
            className={inputCls}
          />
        </label>
        <label className="flex min-w-[12rem] flex-1 flex-col gap-1">
          <span className="text-xs text-muted">Description</span>
          <input
            name="description"
            placeholder="Recherche, rédaction, RDV…"
            className={inputCls}
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {pending ? "…" : "Ajouter"}
        </button>
      </div>
      {state.error && (
        <p className="mt-2 text-sm text-red-600">{state.error}</p>
      )}
    </form>
  );
}
