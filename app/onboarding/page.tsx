import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingForm } from "./onboarding-form";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Déjà rattaché à un cabinet ? -> dashboard
  const { data: profile } = await supabase
    .from("profiles")
    .select("cabinet_id")
    .eq("id", user.id)
    .single();
  if (profile?.cabinet_id) redirect("/dashboard");

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6">
      <div className="mb-8 flex max-w-sm flex-col items-center text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/ozance-mark-navy.png" alt="Ozance" width={44} className="mb-4 h-11 w-auto dark:hidden" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/ozance-mark-gold.png" alt="Ozance" width={44} className="mb-4 hidden h-11 w-auto dark:block" />
        <h1 className="text-2xl font-semibold tracking-tight">
          Bienvenue sur Ozance
        </h1>
        <p className="mt-1 text-sm text-muted">
          Créez votre cabinet pour commencer.
        </p>
      </div>
      <OnboardingForm />
    </main>
  );
}
