"use client";

import { useActionState } from "react";
import { updateMemberRole, removeMember } from "./actions";

const selectCls =
  "rounded-md border border-border-strong bg-white px-2.5 py-1.5 text-xs font-medium outline-none focus:border-zinc-900 disabled:opacity-50 dark:border-border-strong dark:bg-zinc-900 dark:focus:border-zinc-100";

export function MemberControls({
  memberId,
  role,
  isSelf,
  memberName,
}: {
  memberId: string;
  role: string;
  isSelf: boolean;
  memberName: string;
}) {
  const [roleState, roleAction, rolePending] = useActionState(
    updateMemberRole,
    {},
  );
  const [rmState, rmAction, rmPending] = useActionState(removeMember, {});
  const error = roleState.error ?? rmState.error;

  return (
    <div className="flex shrink-0 flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        <form action={roleAction}>
          <input type="hidden" name="member_id" value={memberId} />
          {/* key={role} : remonte le select sur la valeur serveur après mise à jour. */}
          <select
            key={role}
            name="role"
            defaultValue={role}
            disabled={rolePending}
            onChange={(e) => e.currentTarget.form?.requestSubmit()}
            className={selectCls}
            aria-label={`Rôle de ${memberName}`}
          >
            <option value="admin">Administrateur</option>
            <option value="avocat">Avocat</option>
            <option value="assistant">Assistant</option>
          </select>
        </form>

        {!isSelf && (
          <form
            action={rmAction}
            onSubmit={(e) => {
              if (!confirm(`Retirer ${memberName} du cabinet ?`))
                e.preventDefault();
            }}
          >
            <input type="hidden" name="member_id" value={memberId} />
            <button
              type="submit"
              disabled={rmPending}
              className="rounded-md border border-border-strong px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-black/[0.04] hover:text-foreground disabled:opacity-50 dark:hover:bg-white/5"
            >
              {rmPending ? "…" : "Retirer"}
            </button>
          </form>
        )}
      </div>
      {error && (
        <span className="text-xs text-red-600 dark:text-red-400">{error}</span>
      )}
    </div>
  );
}
