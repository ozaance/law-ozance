import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <span className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-xl font-semibold text-accent-foreground shadow-[var(--shadow-md)]">
        §
      </span>
      <p className="tnum text-sm font-medium text-muted">Erreur 404</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">
        Page introuvable
      </h1>
      <p className="mt-2 max-w-sm text-sm text-muted">
        Cette page n&apos;existe pas ou a été déplacée.
      </p>
      <Link
        href="/dashboard"
        className="mt-6 rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
      >
        Retour au tableau de bord
      </Link>
    </main>
  );
}
