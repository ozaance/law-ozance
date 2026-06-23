"use client";

import { useActionState } from "react";
import { acceptInvitation } from "../actions";

export function AcceptForm({
  token,
  cabinetNom,
  role,
}: {
  token: string;
  cabinetNom: string;
  role: string;
}) {
  const [state, action, pending] = useActionState(acceptInvitation, {});

  return (
    <form action={action} className="flex w-full flex-col gap-3">
      <input type="hidden" name="token" value={token} />
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
        {pending ? "…" : `Rejoindre ${cabinetNom} comme ${role}`}
      </button>
    </form>
  );
}
