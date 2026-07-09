"use client";

import { useFormStatus } from "react-dom";
import { signInWithApple } from "./actions";

// Affiché uniquement si le provider Apple est configuré (Supabase) et le flag
// NEXT_PUBLIC_APPLE_SIGNIN activé — évite un bouton non fonctionnel en prod.
export const APPLE_SIGNIN_ENABLED =
  process.env.NEXT_PUBLIC_APPLE_SIGNIN === "true";

function AppleIcon() {
  return (
    <svg width="16" height="18" viewBox="0 0 16 18" aria-hidden="true" fill="currentColor">
      <path d="M13.28 9.57c-.02-2.02 1.65-2.99 1.72-3.04-.94-1.37-2.4-1.56-2.92-1.58-1.24-.13-2.42.73-3.05.73-.63 0-1.6-.71-2.63-.69-1.35.02-2.6.79-3.3 2-1.4 2.43-.36 6.03 1.01 8.01.67.97 1.47 2.06 2.52 2.02 1.01-.04 1.39-.65 2.61-.65 1.22 0 1.56.65 2.63.63 1.09-.02 1.78-.99 2.44-1.97.77-1.13 1.09-2.22 1.11-2.28-.02-.01-2.13-.82-2.15-3.24zM11.28 3.38c.56-.68.94-1.62.83-2.56-.81.03-1.79.54-2.37 1.21-.52.6-.97 1.56-.85 2.48.9.07 1.83-.46 2.39-1.13z" />
    </svg>
  );
}

function Inner({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex w-full items-center justify-center gap-2.5 rounded-md border border-zinc-900 bg-zinc-900 px-3 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50 dark:border-white dark:bg-white dark:text-zinc-900"
    >
      <AppleIcon />
      {pending ? "Redirection…" : label}
    </button>
  );
}

export function AppleButton({
  next,
  label = "Continuer avec Apple",
}: {
  next?: string;
  label?: string;
}) {
  return (
    <form action={signInWithApple} className="w-full">
      {next && <input type="hidden" name="next" value={next} />}
      <Inner label={label} />
    </form>
  );
}
