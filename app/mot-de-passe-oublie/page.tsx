import { ResetForm } from "./reset-form";

export default function MotDePasseOubliePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6">
      <div className="mb-8 flex max-w-sm flex-col items-center text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/ozance-mark-navy.png" alt="Ozance" width={44} className="mb-4 h-11 w-auto dark:hidden" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/ozance-mark-gold.png" alt="Ozance" width={44} className="mb-4 hidden h-11 w-auto dark:block" />
        <h1 className="text-2xl font-semibold tracking-tight">
          Mot de passe oublié
        </h1>
        <p className="mt-1 text-sm text-muted">
          Saisissez votre email : nous vous enverrons un lien pour définir un
          nouveau mot de passe.
        </p>
      </div>
      <ResetForm />
    </main>
  );
}
