"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { login, magicLink } from "@/app/auth/actions";
import { GoogleButton, OrDivider } from "@/app/auth/google-button";

type Mode = "password" | "magic";

const tabBase =
  "flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors";

export function LoginForm({ next }: { next?: string }) {
  const [mode, setMode] = useState<Mode>("password");
  const [pwState, pwAction, pwPending] = useActionState(login, {});
  const [mlState, mlAction, mlPending] = useActionState(magicLink, {});
  const signupHref = next
    ? `/signup?next=${encodeURIComponent(next)}`
    : "/signup";

  return (
    <div className="w-full max-w-sm">
      <GoogleButton next={next} />
      <OrDivider />

      <div className="mb-6 flex gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-900">
        <button
          type="button"
          onClick={() => setMode("password")}
          className={`${tabBase} ${
            mode === "password"
              ? "bg-white shadow-sm dark:bg-zinc-800"
              : "text-muted"
          }`}
        >
          Mot de passe
        </button>
        <button
          type="button"
          onClick={() => setMode("magic")}
          className={`${tabBase} ${
            mode === "magic"
              ? "bg-white shadow-sm dark:bg-zinc-800"
              : "text-muted"
          }`}
        >
          Lien magique
        </button>
      </div>

      {mode === "password" ? (
        <form action={pwAction} className="flex flex-col gap-4">
          {next && <input type="hidden" name="next" value={next} />}
          <Field label="Email" name="email" type="email" autoComplete="email" />
          <Field
            label="Mot de passe"
            name="password"
            type="password"
            autoComplete="current-password"
          />
          <div className="-mt-2 text-right">
            <Link
              href="/mot-de-passe-oublie"
              className="text-xs font-medium text-muted hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              Mot de passe oublié ?
            </Link>
          </div>
          {pwState.error && <ErrorMsg>{pwState.error}</ErrorMsg>}
          <SubmitButton pending={pwPending}>Se connecter</SubmitButton>
        </form>
      ) : (
        <form action={mlAction} className="flex flex-col gap-4">
          {next && <input type="hidden" name="next" value={next} />}
          <Field label="Email" name="email" type="email" autoComplete="email" />
          {mlState.error && <ErrorMsg>{mlState.error}</ErrorMsg>}
          {mlState.message && <InfoMsg>{mlState.message}</InfoMsg>}
          <SubmitButton pending={mlPending}>
            Recevoir un lien de connexion
          </SubmitButton>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-muted">
        Pas encore de compte ?{" "}
        <Link href={signupHref} className="font-medium text-zinc-900 underline dark:text-zinc-100">
          Créer un cabinet
        </Link>
      </p>
    </div>
  );
}

function Field({
  label,
  name,
  type,
  autoComplete,
}: {
  label: string;
  name: string;
  type: string;
  autoComplete?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {label}
      </span>
      <input
        name={name}
        type={type}
        required
        autoComplete={autoComplete}
        className="rounded-md border border-border-strong bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-border-strong dark:bg-zinc-900 dark:focus:border-zinc-100"
      />
    </label>
  );
}

function SubmitButton({
  children,
  pending,
}: {
  children: React.ReactNode;
  pending: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-zinc-900 px-3 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
    >
      {pending ? "…" : children}
    </button>
  );
}

function ErrorMsg({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
      {children}
    </p>
  );
}

function InfoMsg({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
      {children}
    </p>
  );
}
