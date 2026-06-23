import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/ozance-mark-navy.png" alt="Ozance" width={44} className="mb-5 h-11 w-auto dark:hidden" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/ozance-mark-gold.png" alt="Ozance" width={44} className="mb-5 hidden h-11 w-auto dark:block" />
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
