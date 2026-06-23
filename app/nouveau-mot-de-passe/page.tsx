import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { UpdateForm } from "./update-form";

export default async function NouveauMotDePassePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6">
      <div className="mb-8 flex max-w-sm flex-col items-center text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/ozance-mark-navy.png" alt="Ozance" width={44} className="mb-4 h-11 w-auto dark:hidden" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/ozance-mark-gold.png" alt="Ozance" width={44} className="mb-4 hidden h-11 w-auto dark:block" />
        <h1 className="text-2xl font-semibold tracking-tight">
          Nouveau mot de passe
        </h1>
        <p className="mt-1 text-sm text-muted">
          {user
            ? "Choisissez votre nouveau mot de passe."
            : "Ce lien est invalide ou a expiré."}
        </p>
      </div>

      {user ? (
        <UpdateForm />
      ) : (
        <Link
          href="/mot-de-passe-oublie"
          className="text-sm font-medium text-zinc-900 underline dark:text-zinc-100"
        >
          Renvoyer un lien de réinitialisation
        </Link>
      )}
    </main>
  );
}
