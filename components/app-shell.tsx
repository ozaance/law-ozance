import Link from "next/link";
import { signout } from "@/app/auth/actions";
import type { CurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { NavLinks } from "./nav-links";
import { FloatingTimer } from "@/app/temps/floating-timer";
import { Tutorial } from "./tutorial";
import { AssistantWidget } from "./assistant-widget";

// Chrono actif de l'utilisateur + dossiers (pour le widget flottant global).
async function getTimerContext(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("active_timers")
    .select("dossier_id, description, started_at, accumulated_seconds")
    .eq("user_id", userId)
    .maybeSingle();

  if (!data) return { active: null, dossiers: [] };

  // On ne charge la liste des dossiers que lorsqu'un chrono tourne.
  const { data: dossiersRaw } = await supabase
    .from("dossiers")
    .select("id, reference, titre")
    .order("created_at", { ascending: false });

  return {
    active: {
      dossierId: data.dossier_id,
      description: data.description,
      startedAt: data.started_at,
      accumulatedSeconds: data.accumulated_seconds ?? 0,
    },
    dossiers: (dossiersRaw ?? []).map((d) => ({
      id: d.id,
      label: `${d.reference} — ${d.titre}`,
    })),
  };
}

function initials(user: CurrentUser): string {
  const base = user.nomComplet ?? user.email ?? "";
  const parts = base.split(/[\s@.]+/).filter(Boolean);
  return (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
}

function Brand() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2.5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/ozance-mark-navy.png"
        alt="Ozance"
        width={24}
        className="block h-6 w-auto dark:hidden"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/ozance-mark-gold.png"
        alt="Ozance"
        width={24}
        className="hidden h-6 w-auto dark:block"
      />
      <span className="text-base font-semibold tracking-tight">Ozance</span>
    </Link>
  );
}

function UserBlock({ user }: { user: CurrentUser }) {
  return (
    <div className="flex items-center gap-3">
      <Link
        href="/parametres"
        className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg p-1.5 transition-colors hover:bg-black/[0.04] dark:hover:bg-white/5"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-xs font-semibold uppercase text-accent">
          {initials(user)}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium leading-tight">
            {user.nomComplet ?? user.email}
          </span>
          <span className="block truncate text-xs text-muted">
            {user.cabinetNom}
          </span>
        </span>
      </Link>
      <form action={signout}>
        <button
          type="submit"
          title="Déconnexion"
          aria-label="Déconnexion"
          className="rounded-lg p-2 text-muted transition-colors hover:bg-black/[0.04] hover:text-foreground dark:hover:bg-white/5"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </form>
    </div>
  );
}

export async function AppShell({
  user,
  children,
}: {
  user: CurrentUser;
  children: React.ReactNode;
}) {
  const { active: activeTimer, dossiers: timerDossiers } =
    await getTimerContext(user.id);
  return (
    <div className="min-h-dvh">
      {/* Barre latérale (desktop) */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-60 flex-col border-r border-border bg-surface px-3 py-5 md:flex">
        <div className="px-2">
          <Brand />
        </div>
        <nav className="mt-7 flex flex-1 flex-col gap-0.5">
          <NavLinks />
        </nav>
        <div className="border-t border-border pt-3">
          <UserBlock user={user} />
        </div>
      </aside>

      {/* Barre supérieure (mobile) */}
      <header className="sticky top-0 z-20 border-b border-border bg-surface/80 backdrop-blur md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <Brand />
          <form action={signout}>
            <button
              type="submit"
              className="rounded-lg border border-border px-3 py-1.5 text-sm"
            >
              Déconnexion
            </button>
          </form>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-4 pb-3">
          <NavLinks variant="bar" />
        </nav>
      </header>

      {/* Contenu */}
      <div className="md:pl-60">
        <main className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 md:py-10">
          {children}
        </main>
      </div>

      {/* Chrono flottant global (déplaçable, présent sur toutes les pages) */}
      <FloatingTimer active={activeTimer} dossiers={timerDossiers} />

      {/* Tutoriel d'intro (une seule fois, skippable) */}
      {!user.tutorielVu && <Tutorial />}

      {/* Assistant IA (présent sur toutes les pages de l'application) */}
      <AssistantWidget />
    </div>
  );
}
