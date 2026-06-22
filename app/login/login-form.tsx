"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { login, magicLink } from "@/app/auth/actions";

type Mode = "password" | "magic";

const tabBase =
  "flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors";

export function LoginForm() {
  const [mode, setMode] = useState<Mode>("password");
  const [pwState, pwAction, pwPending] = useActionState(login, {});
  const [mlState, mlAction, mlPending] = useActionState(magicLink, {});

  return (
    <div className="w-full max-w-sm">
      <div className="mb-6 flex gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-900">
        <button
          type="button"
          onClick={() => setMode("password")}
          className={`${tabBase} ${
            mode === "password"
              ? "bg-white shadow-sm dark:bg-zinc-800"
              : "text-zinc-500"
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
              : "text-zinc-500"
          }`}
        >
          Lien magique
        </button>
      </div>

      {mode === "password" ? (
        <form action={pwAction} className="flex flex-col gap-4">
          <Field label="Email" name="email" type="email" autoComplete="email" />
          <Field
            label="Mot de passe"
            name="password"
            type="password"
            autoComplete="current-password"
          />
          {pwState.error && <ErrorMsg>{pwState.error}</ErrorMsg>}
          <SubmitButton pending={pwPending}>Se connecter</SubmitButton>
        </form>
      ) : (
        <form action={mlAction} className="flex flex-col gap-4">
          <Field label="Email" name="email" type="email" autoComplete="email" />
          {mlState.error && <ErrorMsg>{mlState.error}</ErrorMsg>}
          {mlState.message && <InfoMsg>{mlState.message}</InfoMsg>}
          <SubmitButton pending={mlPending}>
            Recevoir un lien de connexion
          </SubmitButton>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-zinc-500">
        Pas encore de compte ?{" "}
        <Link href="/signup" className="font-medium text-zinc-900 underline dark:text-zinc-100">
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
        className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-100"
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
