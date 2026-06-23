"use client";

import { useActionState } from "react";
import { setMemberCost } from "./actions";

export function CostInput({
  memberId,
  cout,
}: {
  memberId: string;
  cout: number | null;
}) {
  const [state, action, pending] = useActionState(setMemberCost, {});

  return (
    <form action={action} className="flex items-center justify-end gap-1">
      <input type="hidden" name="member_id" value={memberId} />
      <input
        name="cout"
        type="number"
        step="1"
        min="0"
        defaultValue={cout ?? ""}
        placeholder="—"
        disabled={pending}
        onBlur={(e) => {
          if (String(cout ?? "") !== e.currentTarget.value)
            e.currentTarget.form?.requestSubmit();
        }}
        className="w-20 rounded-md border border-border-strong bg-white px-2 py-1 text-right text-xs outline-none focus:border-zinc-900 disabled:opacity-50 dark:border-border-strong dark:bg-zinc-900 dark:focus:border-zinc-100"
        aria-label="Coût horaire (€/h)"
        title={state.error ?? "Coût horaire (€/h)"}
      />
      <span className="text-xs text-muted">€/h</span>
    </form>
  );
}
