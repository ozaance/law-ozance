"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { stopTimer, cancelTimer, setTimerDossier } from "./actions";
import { DossierSelect, type DossierOption } from "./dossier-select";

export type FloatingActive = {
  dossierId: string | null;
  description: string | null;
  startedAt: string;
};

const POS_KEY = "oz-timer-pos";
const W = 280;

function fmtElapsed(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

export function FloatingTimer({
  active,
  dossiers,
}: {
  active: FloatingActive | null;
  dossiers: DossierOption[];
}) {
  const pathname = usePathname();
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const drag = useRef<{ dx: number; dy: number } | null>(null);

  // Position initiale (après montage, pour rester compatible SSR) :
  // sauvegardée ou coin bas-droit.
  useEffect(() => {
    let next = {
      x: Math.max(16, window.innerWidth - W - 24),
      y: Math.max(16, window.innerHeight - 150),
    };
    try {
      const saved = localStorage.getItem(POS_KEY);
      if (saved) next = JSON.parse(saved);
    } catch {}
    // eslint-disable-next-line react-hooks/set-state-in-effect -- init dépendant du navigateur, une seule fois au montage
    setPos(next);
  }, []);

  // Tic chaque seconde quand un chrono tourne.
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [active]);

  function onPointerDown(e: React.PointerEvent) {
    if (!pos) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y };
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!drag.current) return;
    const x = Math.min(
      Math.max(8, e.clientX - drag.current.dx),
      window.innerWidth - W - 8,
    );
    const y = Math.min(
      Math.max(8, e.clientY - drag.current.dy),
      window.innerHeight - 70,
    );
    setPos({ x, y });
  }
  function onPointerUp() {
    drag.current = null;
    if (pos) {
      try {
        localStorage.setItem(POS_KEY, JSON.stringify(pos));
      } catch {}
    }
  }

  // Pas de widget si aucun chrono, sur la page /temps (qui a déjà le sien), ou avant calcul de position.
  if (!active || pathname.startsWith("/temps") || !pos) return null;

  const elapsed = now - new Date(active.startedAt).getTime();

  return (
    <div
      style={{ position: "fixed", left: pos.x, top: pos.y, width: W, zIndex: 60 }}
      className="select-none rounded-xl border border-border bg-surface shadow-[0_18px_50px_-12px_rgba(0,0,0,.45)]"
    >
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        className="flex cursor-grab items-center gap-2 rounded-t-xl border-b border-border bg-surface-2 px-3 py-1.5 active:cursor-grabbing"
      >
        <span className="h-2 w-2 animate-pulse rounded-full bg-accent" />
        <span className="text-xs font-medium uppercase tracking-wide text-accent">
          Chrono en cours
        </span>
        <span className="ml-auto text-[10px] text-muted">⠿ déplacer</span>
      </div>

      <div className="px-3 py-2.5">
        <DossierSelect
          action={setTimerDossier}
          dossiers={dossiers}
          current={active.dossierId}
          compact
        />
        {active.description && (
          <p className="mt-1 truncate text-xs text-muted">{active.description}</p>
        )}
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="font-mono text-2xl font-semibold tabular-nums">
            {fmtElapsed(elapsed)}
          </span>
          <div className="flex gap-1.5">
            <form action={stopTimer}>
              <button
                type="submit"
                className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 dark:bg-zinc-100 dark:text-zinc-900"
              >
                Arrêter
              </button>
            </form>
            <form action={cancelTimer}>
              <button
                type="submit"
                title="Annuler"
                aria-label="Annuler le chrono"
                className="rounded-md border border-border-strong px-2 py-1.5 text-xs text-muted transition-colors hover:bg-black/[0.04] hover:text-foreground dark:hover:bg-white/5"
              >
                ✕
              </button>
            </form>
          </div>
        </div>
        <Link
          href="/temps"
          className="mt-2 inline-block text-xs font-medium text-accent hover:underline"
        >
          Ouvrir la feuille de temps →
        </Link>
      </div>
    </div>
  );
}
