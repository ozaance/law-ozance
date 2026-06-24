"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // À remplacer par un vrai logger (Sentry…) le moment venu.
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <div className="max-w-sm">
        <h1 className="text-xl font-semibold tracking-tight">
          Une erreur est survenue
        </h1>
        <p className="mt-2 text-sm text-muted">
          Quelque chose s&apos;est mal passé de notre côté. Réessayez, ou
          revenez à l&apos;accueil.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={reset}
            className="rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 dark:bg-zinc-100 dark:text-zinc-900"
          >
            Réessayer
          </button>
          <Link
            href="/"
            className="rounded-md border border-border-strong px-4 py-2.5 text-sm font-medium transition-colors hover:bg-black/[0.04] dark:hover:bg-white/5"
          >
            Accueil
          </Link>
        </div>
      </div>
    </main>
  );
}
