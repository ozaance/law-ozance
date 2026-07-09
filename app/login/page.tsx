import { LoginForm } from "./login-form";

const ERROR_MESSAGES: Record<string, string> = {
  google: "La connexion Google a échoué. Veuillez réessayer.",
  apple: "La connexion Apple a échoué. Veuillez réessayer.",
  oauth: "La connexion a échoué. Veuillez réessayer.",
  lien_invalide: "Lien expiré ou invalide. Veuillez vous reconnecter.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string; compte?: string }>;
}) {
  const { next, error, compte } = await searchParams;
  const errorMsg = error ? ERROR_MESSAGES[error] : null;
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6">
      <div className="mb-8 flex flex-col items-center text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/ozance-mark-navy.png" alt="Ozance" width={44} className="mb-4 h-11 w-auto dark:hidden" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/ozance-mark-gold.png" alt="Ozance" width={44} className="mb-4 hidden h-11 w-auto dark:block" />
        <h1 className="text-2xl font-semibold tracking-tight">Ozance</h1>
        <p className="mt-1 text-sm text-muted">
          Connectez-vous à votre cabinet
        </p>
      </div>
      {errorMsg && (
        <p className="mb-4 w-full max-w-sm rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {errorMsg}
        </p>
      )}
      {compte === "supprime" && (
        <p className="mb-4 w-full max-w-sm rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
          Votre compte a été supprimé. Au revoir.
        </p>
      )}
      <LoginForm next={next} />
      <p className="mt-8 text-xs text-muted">
        <a href="/confidentialite" className="hover:underline">
          Politique de confidentialité
        </a>
      </p>
    </main>
  );
}
