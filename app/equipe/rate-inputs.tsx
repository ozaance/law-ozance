"use client";

import { useActionState } from "react";
import { setMemberRate, setMemberCost } from "./actions";

const inputCls =
  "w-24 rounded-md border border-border-strong bg-white px-2 py-1 text-right text-sm outline-none focus:border-zinc-900 disabled:opacity-50 dark:border-border-strong dark:bg-zinc-900 dark:focus:border-zinc-100";

// Édition des deux taux d'un membre (admin) : taux facturé et coût horaire.
export function RateInputs({
  memberId,
  taux,
  cout,
}: {
  memberId: string;
  taux: number | null;
  cout: number | null;
}) {
  const [rateState, rateAction, ratePending] = useActionState(setMemberRate, {});
  const [costState, costAction, costPending] = useActionState(setMemberCost, {});

  return (
    <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2">
      <label className="flex items-center gap-1.5">
        <span className="text-xs text-muted">Taux facturé</span>
        <form action={rateAction} className="flex items-center gap-1">
          <input type="hidden" name="member_id" value={memberId} />
          <input
            name="taux"
            type="number"
            step="1"
            min="0"
            defaultValue={taux ?? ""}
            placeholder="—"
            disabled={ratePending}
            onBlur={(e) => {
              if (String(taux ?? "") !== e.currentTarget.value)
                e.currentTarget.form?.requestSubmit();
            }}
            className={inputCls}
            title={rateState.error ?? "Taux horaire facturé au client (€/h)"}
          />
          <span className="text-xs text-muted">€/h</span>
        </form>
      </label>

      <label className="flex items-center gap-1.5">
        <span className="text-xs text-muted">Coût</span>
        <form action={costAction} className="flex items-center gap-1">
          <input type="hidden" name="member_id" value={memberId} />
          <input
            name="cout"
            type="number"
            step="1"
            min="0"
            defaultValue={cout ?? ""}
            placeholder="—"
            disabled={costPending}
            onBlur={(e) => {
              if (String(cout ?? "") !== e.currentTarget.value)
                e.currentTarget.form?.requestSubmit();
            }}
            className={inputCls}
            title={costState.error ?? "Coût horaire interne, salaire chargé (€/h)"}
          />
          <span className="text-xs text-muted">€/h</span>
        </form>
      </label>
    </div>
  );
}
