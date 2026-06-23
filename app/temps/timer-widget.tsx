"use client";

import { useActionState, useEffect, useState } from "react";
import { startTimer, stopTimer, cancelTimer, setTimerDossier } from "./actions";
import { DossierSelect, type DossierOption } from "./dossier-select";

const inputCls =
  "rounded-md border border-border-strong bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-border-strong dark:bg-zinc-900 dark:focus:border-zinc-100";

type ActiveTimer = {
  dossierId: string | null;
  description: string | null;
  startedAt: string;
};

function fmtElapsed(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

function RunningTimer({
  timer,
  dossiers,
}: {
  timer: ActiveTimer;
  dossiers: DossierOption[];
}) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const elapsed = now - new Date(timer.startedAt).getTime();

  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-accent">
            <span className="h-2 w-2 animate-pulse rounded-full bg-accent" />
            En cours
          </div>
          <div className="mt-2 w-56 max-w-full">
            <DossierSelect
              action={setTimerDossier}
              dossiers={dossiers}
              current={timer.dossierId}
            />
          </div>
          {timer.description && (
            <p className="mt-1 truncate text-xs text-muted">
              {timer.description}
            </p>
          )}
        </div>
        <div className="font-mono text-3xl font-semibold tabular-nums tracking-tight">
          {fmtElapsed(elapsed)}
        </div>
        <div className="flex gap-2">
          <form action={stopTimer}>
            <button
              type="submit"
              className="rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 dark:bg-zinc-100 dark:text-zinc-900"
            >
              Arrêter &amp; enregistrer
            </button>
          </form>
          <form action={cancelTimer}>
            <button
              type="submit"
              className="rounded-md border border-border-strong px-3 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-black/[0.04] hover:text-foreground dark:hover:bg-white/5"
            >
              Annuler
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function StartTimer({ dossiers }: { dossiers: DossierOption[] }) {
  const [state, action, pending] = useActionState(startTimer, {});

  return (
    <div className="card p-5">
      <h2 className="text-sm font-semibold">Chronomètre</h2>
      <p className="mt-1 text-sm text-muted">
        Démarrez le chrono, avec ou sans dossier ; vous pourrez l&apos;attribuer
        plus tard. À l&apos;arrêt, le temps est ajouté à votre feuille de temps.
      </p>
      <form action={action} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex flex-1 flex-col gap-1.5">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Dossier (optionnel)
          </span>
          <select name="dossier_id" defaultValue="" className={inputCls}>
            <option value="">Sans dossier (à attribuer plus tard)</option>
            {dossiers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-1 flex-col gap-1.5">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Description (optionnel)
          </span>
          <input
            name="description"
            placeholder="ex. Rédaction conclusions"
            className={inputCls}
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {pending ? "…" : "Démarrer"}
        </button>
      </form>
      {state.error && (
        <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {state.error}
        </p>
      )}
    </div>
  );
}

export function TimerWidget({
  active,
  dossiers,
}: {
  active: ActiveTimer | null;
  dossiers: DossierOption[];
}) {
  return active ? (
    <RunningTimer timer={active} dossiers={dossiers} />
  ) : (
    <StartTimer dossiers={dossiers} />
  );
}
